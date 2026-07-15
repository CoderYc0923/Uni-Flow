package io.uniflow.sdk;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * LangChain4j ChatMemoryStore-compatible Sidecar.
 * Drop-in replacement for in-memory chat memory; optionally syncs summaries to Uni-Flow.
 *
 * When langchain4j is on the classpath, implement:
 *   implements dev.langchain4j.store.memory.chat.ChatMemoryStore
 */
public class UniFlowChatMemoryStore {
    private final UniFlowClient client;
    private final String sessionId;
    private final Map<Object, List<String>> messages = new ConcurrentHashMap<>();

    public UniFlowChatMemoryStore(String baseUrl, String sessionId) {
        this.client = new UniFlowClient(baseUrl);
        this.sessionId = sessionId;
    }

    public List<String> getMessages(Object memoryId) {
        return new ArrayList<>(messages.getOrDefault(memoryId, List.of()));
    }

    public void updateMessages(Object memoryId, List<String> msgs) {
        messages.put(memoryId, new ArrayList<>(msgs));
    }

    public void deleteMessages(Object memoryId) {
        messages.remove(memoryId);
    }

    /** Best-effort remote memory search for RAG-style Sidecar injection. */
    public String searchRemote(String query) {
        try {
            return client.searchMemory(query, 5);
        } catch (Exception e) {
            return "{\"results\":[]}";
        }
    }

    public String getSessionId() {
        return sessionId;
    }
}
