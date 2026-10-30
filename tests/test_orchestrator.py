import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

SOURCE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('orchestrator', SOURCE/'tools/orchestrator.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

class StateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        for p in ['.ai/project.json','.ai/state/active.json','.ai/cases/TASK-001.json']:
            m.save(self.root/p, m.load(SOURCE/p))
        task = m.load(self.root/'.ai/cases/TASK-001.json')
        task.update(status='checking', fix_review_cycles=0)
        m.save(self.root/'.ai/cases/TASK-001.json', task)
    def test_domain_task_ids_are_validated(self):
        t=m.load(self.root/'.ai/cases/TASK-001.json');t['id']='IMPORT-001';t['dependencies']=['IMPORT-001']
        m.save(self.root/'.ai/cases/IMPORT-001.json',t)
        with self.assertRaises(ValueError): m.validate(self.root)
    def test_domain_task_ownership_is_validated(self):
        t=m.load(self.root/'.ai/cases/TASK-001.json');t['id']='IMPORT-001';t['write_paths']=['tools/file.py']
        m.save(self.root/'.ai/cases/IMPORT-001.json',t)
        with self.assertRaises(ValueError): m.validate(self.root)
    def test_template_valid(self):
        self.assertEqual(m.validate(self.root)['tasks'], 1)
    def test_two_failures_block_and_persist(self):
        self.assertEqual(m.cycle(self.root,'TASK-001')['status'],'revision_required')
        self.assertEqual(m.cycle(self.root,'TASK-001')['status'],'blocked')
        self.assertTrue((self.root/'.ai/cases/CASE-TASK-001.json').exists())
        with self.assertRaises(ValueError): m.cycle(self.root,'TASK-001')
        self.assertEqual(m.load(self.root/'.ai/cases/TASK-001.json')['fix_review_cycles'],2)
    def test_traversal_rejected(self):
        with self.assertRaises(ValueError): m.cycle(self.root,'../../escape')
    def test_dependency_cycle_rejected(self):
        t=m.load(self.root/'.ai/cases/TASK-001.json'); t['dependencies']=['TASK-001']
        m.save(self.root/'.ai/cases/TASK-001.json',t)
        with self.assertRaises(ValueError): m.validate(self.root)
    def test_overlapping_writers_rejected(self):
        t=m.load(self.root/'.ai/cases/TASK-001.json'); t['id']='TASK-002';t['write_paths']=['tools/nested/file.py']
        m.save(self.root/'.ai/cases/TASK-002.json',t)
        with self.assertRaises(ValueError): m.validate(self.root)
    def test_resume_detects_changed_head(self):
        def git(*args):
            subprocess.run(['git','-C',str(self.root),*args],check=True,capture_output=True)
        git('init','-b','main');git('config','user.name','Test');git('config','user.email','test@example.invalid')
        git('add','.');git('commit','-m','synthetic initial')
        m.checkpoint(self.root,'TASK-001','repeat synthetic check')
        git('add','.');git('commit','-m','synthetic checkpoint')
        self.assertIn('head',m.resume(self.root)['mismatches'])
    def test_missing_dependency_rejected(self):
        t=m.load(self.root/'.ai/cases/TASK-001.json');t['dependencies']=['TASK-404']
        m.save(self.root/'.ai/cases/TASK-001.json',t)
        with self.assertRaises(ValueError): m.validate(self.root)

if __name__ == '__main__': unittest.main()
