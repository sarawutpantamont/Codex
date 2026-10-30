"""Local state helper. No remote calls, code execution, or approval synthesis."""
import argparse
import json
import os
import re
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path


def load(path):
    return json.loads(path.read_text())


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode='w', dir=path.parent, delete=False) as f:
        json.dump(value, f, indent=2)
        f.write('\n')
        temporary = f.name
    os.replace(temporary, path)


def task_path(root, task):
    if not re.fullmatch(r'[A-Z][A-Z0-9_-]{0,79}', task):
        raise ValueError('Use an opaque uppercase task ID, not a path.')
    path = root / '.ai/cases' / (task + '.json')
    if path.is_symlink() or not path.resolve().is_relative_to(root.resolve()):
        raise ValueError('Unsafe task path')
    return path


def git(root, *args):
    result = subprocess.run(['git', '-C', str(root), *args], text=True, capture_output=True)
    if result.returncode:
        raise ValueError('Git state unavailable; initialize/fetch the repository before checkpointing.')
    return result.stdout.strip()


def snapshot(root):
    return {'head': git(root, 'rev-parse', 'HEAD'),
            'branch': git(root, 'symbolic-ref', '--short', 'HEAD'),
            'dirty_paths': git(root, 'status', '--porcelain').splitlines()}


def validate(root):
    config = load(root / '.ai/project.json')
    if config.get('schema_version') != 1 or not config.get('protected_paths'):
        raise ValueError('Invalid project configuration')
    tasks = {}
    for p in (root / '.ai/cases').glob('*.json'):
        t = load(p)
        if t.get('record_type') != 'task':
            continue
        if t.get('id') != p.stem or t.get('schema_version') != 1:
            raise ValueError('Invalid task identity')
        if t.get('risk', {}).get('level') not in ('low', 'medium', 'high'):
            raise ValueError('Invalid risk')
        count = t.get('fix_review_cycles')
        if type(count) is not int or count < 0:
            raise ValueError('Invalid revision count')
        if count >= 2 and t.get('status') not in ('blocked', 'resolved'):
            raise ValueError('Two failed cycles require a blocked or resolved state')
        tasks[t['id']] = t
    seen, visiting = set(), set()
    def visit(key):
        if key in visiting:
            raise ValueError('Dependency cycle')
        if key in seen:
            return
        if key not in tasks:
            raise ValueError('Missing dependency')
        visiting.add(key)
        for dep in tasks[key].get('dependencies', []):
            visit(dep)
        visiting.remove(key)
        seen.add(key)
    owners = []
    for key, t in tasks.items():
        visit(key)
        if t.get('status') in ('working', 'checking', 'pre_final'):
            for path in t.get('write_paths', []):
                clean = path.rstrip('/')
                if not clean or '..' in Path(clean).parts or Path(clean).is_absolute():
                    raise ValueError('Unsafe write path')
                for other, previous in owners:
                    if other != key and (clean == previous or clean.startswith(previous+'/') or previous.startswith(clean+'/')):
                        raise ValueError('Overlapping active write ownership')
                owners.append((key, clean))
    active = load(root / '.ai/state/active.json')
    if active.get('task_id') not in tasks:
        raise ValueError('Active task missing')
    return {'valid': True, 'tasks': len(tasks)}


def cycle(root, task):
    path = task_path(root, task)
    value = load(path)
    count = value['fix_review_cycles']
    if count >= 2:
        raise ValueError('Already blocked: new evidence and an approved next approach must be recorded; do not reset cycles.')
    value['updated_at'] = datetime.now(timezone.utc).isoformat()
    value['fix_review_cycles'] = count + 1
    value['status'] = 'blocked' if count + 1 == 2 else 'revision_required'
    save(path, value)
    if value['status'] == 'blocked':
        case = root / '.ai/cases' / ('CASE-' + task + '.json')
        if not case.exists():
            save(case, {'schema_version': 1, 'id': 'CASE-'+task, 'record_type': 'blocked_case', 'task_id': task,
                        'status': 'blocked', 'fix_review_cycles': 2,
                        'created_at': value['updated_at'], 'updated_at': value['updated_at'],
                        'reproduction': [], 'expected': None, 'actual': None,
                        'attempts': [], 'evidence_refs': [], 'restart_condition': None,
                        'issue_url': None, 'next_action': 'Complete safe reproduction; create/update one issue; continue independent work.'})
    return {'task_id': task, 'status': value['status'], 'fix_review_cycles': count+1}


def checkpoint(root, task, next_action):
    if not task_path(root, task).exists():
        raise ValueError('Task does not exist')
    now = datetime.now(timezone.utc).isoformat()
    # Safe root-relative names only. Review identifiers before publishing state.
    state = snapshot(root)
    state.update(schema_version=1, record_type='checkpoint', id='CHECKPOINT-'+task, task_id=task,
                 updated_at=now, next_action=next_action,
                 limitations=['Working file bytes are not saved by this checkpoint.',
                              'Review paths and next_action for privacy before publishing.'])
    target = root / '.ai/cases' / ('CHECKPOINT-'+task+'.json')
    save(target, state)
    save(root / '.ai/state/active.json', {'schema_version': 1, 'task_id': task,
         'checkpoint': str(target.relative_to(root)), 'next_action': next_action})
    return {'checkpoint': str(target.relative_to(root)), 'head': state['head']}


def resume(root):
    active = load(root / '.ai/state/active.json')
    result = {'active': active, 'actual': snapshot(root), 'mismatches': []}
    if active.get('checkpoint'):
        path = root / active['checkpoint']
        if not path.resolve().is_relative_to(root.resolve()) or path.is_symlink():
            raise ValueError('Unsafe checkpoint reference')
        recorded = load(path)
        for k in ('head', 'branch', 'dirty_paths'):
            if recorded.get(k) != result['actual'][k]:
                result['mismatches'].append(k)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('validate')
    sub.add_parser('resume')
    p = sub.add_parser('cycle'); p.add_argument('task')
    p = sub.add_parser('checkpoint'); p.add_argument('--task', required=True); p.add_argument('--next', required=True)
    args = parser.parse_args()
    try:
        if args.command == 'validate': result = validate(args.root)
        elif args.command == 'resume': result = resume(args.root)
        elif args.command == 'cycle': result = cycle(args.root, args.task)
        else: result = checkpoint(args.root, args.task, args.next)
        print(json.dumps(result, indent=2))
    except (ValueError, KeyError, OSError) as e:
        parser.exit(1, f'{type(e).__name__}: {e}\n')


if __name__ == '__main__':
    main()
