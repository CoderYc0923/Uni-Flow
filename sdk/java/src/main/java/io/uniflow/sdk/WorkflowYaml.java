package io.uniflow.sdk;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Lightweight Workflow YAML checks aligned with uniflow/v1 required fields.
 * For full JSON Schema parity use the shared fixtures with the Node CLI
 * (`uniflow validate`) or Python SDK; this class catches common footguns offline.
 */
public final class WorkflowYaml {
    private static final Pattern API = Pattern.compile("(?m)^apiVersion:\\s*(.+)$");
    private static final Pattern KIND = Pattern.compile("(?m)^kind:\\s*(.+)$");
    private static final Pattern META_ID = Pattern.compile("(?m)^\\s+id:\\s*(\\S+)\\s*$");

    private WorkflowYaml() {}

    public static final class Result {
        public final boolean ok;
        public final List<String> errors;
        public final String workflowId;

        public Result(boolean ok, List<String> errors, String workflowId) {
            this.ok = ok;
            this.errors = errors;
            this.workflowId = workflowId;
        }

        public void raiseForStatus() {
            if (!ok) {
                throw new IllegalArgumentException("YAML validation failed: " + String.join("; ", errors));
            }
        }
    }

    public static Result validate(String yamlOrPath) throws IOException {
        String text = yamlOrPath;
        // Only treat as filesystem path when it looks like one (avoid Path.of on YAML with ':').
        if (yamlOrPath != null
                && !yamlOrPath.contains("\n")
                && !yamlOrPath.contains("\r")
                && !yamlOrPath.trim().startsWith("apiVersion:")) {
            try {
                Path p = Path.of(yamlOrPath);
                if (Files.isRegularFile(p)) {
                    text = Files.readString(p, StandardCharsets.UTF_8);
                }
            } catch (Exception ignored) {
                // fall through — treat as inline YAML
            }
        }
        List<String> errors = new ArrayList<>();
        String api = first(API, text);
        String kind = first(KIND, text);
        String id = first(META_ID, text);
        if (!"uniflow/v1".equals(api == null ? null : api.trim())) {
            errors.add("apiVersion must be uniflow/v1");
        }
        if (!"Workflow".equals(kind == null ? null : kind.trim())) {
            errors.add("kind must be Workflow");
        }
        if (id == null || id.isBlank()) {
            errors.add("metadata.id is required");
        }
        if (!text.contains("units:") || !text.contains("flow:")) {
            errors.add("spec.units and spec.flow are required");
        }
        return new Result(errors.isEmpty(), errors, id == null ? null : id.trim());
    }

    private static String first(Pattern p, String text) {
        Matcher m = p.matcher(text);
        return m.find() ? m.group(1) : null;
    }
}
