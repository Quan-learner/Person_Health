import { useTokenStore } from '@/stores/token.js';

/**
 * AI 聊天 SSE 流式请求
 * 使用 fetch + ReadableStream 处理 Server-Sent Events
 *
 * @param {string} message     用户当前输入的消息
 * @param {Array}  history     历史对话列表 [{role, content}, ...]
 * @param {Function} onToken   每收到一个 token 时的回调
 * @param {Function} onDone    流式传输完成的回调
 * @param {Function} onError   出错时的回调
 * @returns {AbortController}  返回 controller 用于取消请求
 */
export const chatWithAiStream = (message, history, onToken, onDone, onError) => {
    const tokenStore = useTokenStore();
    const controller = new AbortController();
    let sseBuffer = '';
    let eventDataLines = [];
    let finished = false;

    const emitEvent = () => {
        if (eventDataLines.length === 0) {
            return;
        }
        const data = eventDataLines.join('\n');
        eventDataLines = [];
        if (data.trim() === '[DONE]') {
            finished = true;
            onDone && onDone();
            return;
        }
        onToken && onToken(data);
    };

    const processLine = (line) => {
        if (line === '') {
            emitEvent();
            return;
        }
        if (!line.startsWith('data:')) {
            return;
        }
        let payload = line.slice(5);
        if (payload.startsWith(' ')) {
            payload = payload.slice(1);
        }
        eventDataLines.push(payload);
    };

    fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': tokenStore.token || '',
        },
        body: JSON.stringify({ message, history }),
        signal: controller.signal,
    })
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    if (sseBuffer.length > 0) {
                        processLine(sseBuffer.replace(/\r$/, ''));
                    }
                    emitEvent();
                    if (!finished) {
                        onDone && onDone();
                    }
                    break;
                }

                sseBuffer += decoder.decode(value, { stream: true });
                const lines = sseBuffer.split(/\r?\n/);
                sseBuffer = lines.pop() ?? '';
                for (const line of lines) {
                    processLine(line);
                    if (finished) {
                        return;
                    }
                }
            }
        })
        .catch((err) => {
            if (err.name !== 'AbortError') {
                onError && onError(err);
            }
        });

    return controller;
};
