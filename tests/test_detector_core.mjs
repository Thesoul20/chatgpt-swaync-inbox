import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const source = fs.readFileSync(path.join(root, 'userscript', 'chatgpt-swaync-inbox.user.js'), 'utf8');

const context = {
  __CHATGPT_SWAYNC_INBOX_TEST_MODE__: true,
  location: { href: 'https://chatgpt.com/c/example' },
  URL,
  console,
  Set,
};
vm.createContext(context);
vm.runInContext(source, context, { filename: 'chatgpt-swaync-inbox.user.js' });

const core = context.__CHATGPT_SWAYNC_INBOX_TEST__;
assert.ok(core, 'test API should be exposed in test mode');

assert.equal(core.conversationPath('https://chatgpt.com/backend-api/f/conversation?x=1'), '/backend-api/f/conversation');
assert.equal(core.isConversationUrl('https://chatgpt.com/backend-api/conversation'), true);
assert.equal(core.isConversationUrl('https://chatgpt.com/backend-api/models'), false);

const snapshot = core.selectPromptBoundTurn([
  { role: 'user', id: 'u1', text: 'first prompt' },
  { role: 'assistant', id: 'a1', text: 'first answer' },
  { role: 'user', id: 'u2', text: 'latest prompt' },
  { role: 'assistant', id: 'a2', text: 'latest answer' },
]);
assert.equal(snapshot.promptKey, 'u2');
assert.equal(snapshot.promptText, 'latest prompt');
assert.equal(snapshot.answerKey, 'a2');
assert.equal(snapshot.answerText, 'latest answer');

const pending = core.selectPromptBoundTurn([
  { role: 'user', id: 'u1', text: 'old prompt' },
  { role: 'assistant', id: 'a1', text: 'old answer' },
  { role: 'user', id: 'u2', text: 'new prompt' },
]);
assert.equal(pending.promptKey, 'u2');
assert.equal(pending.answerText, '');

assert.equal(core.containsErrorText('There was an error generating a response.'), true);
assert.equal(core.containsErrorText('这里是正常生成完成的回答。'), false);
assert.equal(core.containsErrorText('网络错误，请重试'), true);

assert.equal(core.isManualStopWindow(10_000, 8_000), true);
assert.equal(core.isManualStopWindow(7_000, 8_000), false);
assert.equal(core.isManualStopWindow(20_000, 8_000), false);

assert.equal(
  core.shouldRestoreConversation('https://chatgpt.com/c/a', 'https://chatgpt.com/c/a'),
  false,
);
assert.equal(
  core.shouldRestoreConversation('https://chatgpt.com/c/b', 'https://chatgpt.com/c/a'),
  true,
);
assert.equal(core.shouldRestoreConversation('https://chatgpt.com/c/a', ''), false);

assert.equal(core.cleanText('  hello\n   world  '), 'hello world');
assert.equal(core.signature('same'), core.signature(' same '));

console.log('detector core tests passed');
