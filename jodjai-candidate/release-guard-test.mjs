import assert from 'node:assert/strict';
import {assertSameOriginResponse as check} from './release-guard.mjs';
const origin='https://original.example';
assert.doesNotThrow(()=>check(origin,origin+'/',200,origin+'/',null));
assert.throws(()=>check(origin,origin+'/',307,origin+'/', 'https://new.example/'),/hosting redirects/);
assert.throws(()=>check(origin,origin+'/',200,'https://new.example/',null),/changed origin/);
assert.throws(()=>check(origin,'https://other.example/',200,origin+'/',null),/differs/);
assert.throws(()=>check(origin,origin+'/',503,origin+'/',null),/unavailable/);
console.log('PASS: release guard rejects redirect, different origin, override and unavailable target.');
