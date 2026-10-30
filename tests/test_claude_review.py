import importlib.util
from pathlib import Path
import subprocess
import unittest
s=importlib.util.spec_from_file_location('c',Path(__file__).resolve().parents[1]/'tools/claude_review.py')
m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class ReviewTests(unittest.TestCase):
    def test_isolation(self):
        calls=[]
        def fake(cmd,**kw):
            calls.append((cmd,kw));return subprocess.CompletedProcess(cmd,0,'{"result":"unverifiable","modelUsage":{"claude-opus-5-5":{}}}')
        for role in ('support','opposition'): self.assertEqual(m.review(role,'synthetic',runner=fake)['status'],'review_returned')
        self.assertNotEqual(calls[0][1]['cwd'],calls[1][1]['cwd'])
        for cmd,kw in calls:
            self.assertEqual(cmd[cmd.index('--tools')+1],'')
            self.assertIn('--safe-mode',cmd);self.assertIn('--no-session-persistence',cmd)
            self.assertNotIn('--continue',cmd);self.assertNotIn('--resume',cmd)
    def test_failure_does_not_echo_secrets(self):
        def fake(cmd,**kw):return subprocess.CompletedProcess(cmd,1,'private-output','secret-error')
        self.assertNotIn('secret',str(m.review('auditor','synthetic',runner=fake)))
    def test_bad_json_fallback(self):
        def fake(cmd,**kw):return subprocess.CompletedProcess(cmd,0,'invalid')
        self.assertEqual(m.review('judge','synthetic',runner=fake)['status'],'fallback_required')
    def test_invalid_shapes_fallback(self):
        for payload in ('[]','null','"text"','{"modelUsage":null}',
                        '{"modelUsage":{"other-model":{}},"result":"passed"}',
                        '{"modelUsage":{"claude-opus-5-5":{}},"result":null}'):
            with self.subTest(payload=payload):
                def fake(cmd,**kw):return subprocess.CompletedProcess(cmd,0,payload)
                self.assertEqual(m.review('auditor','synthetic',runner=fake)['status'],'fallback_required')
    def test_packet_limit(self):
        with self.assertRaises(ValueError):m.review('support','x'*65537)
if __name__=='__main__':unittest.main()
