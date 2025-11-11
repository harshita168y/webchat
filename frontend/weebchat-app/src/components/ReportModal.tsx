// src/components/ReportModal.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Modal } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details?: string) => Promise<void>;
};

const REASONS = [
  "Spam",
  "Hate / Harassment",
  "Sexual content",
  "Self-harm",
  "Other"
];

export default function ReportModal({ visible, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");

  const submit = async () => {
    try {
      await onSubmit(reason, details);
      setDetails("");
      onClose();
    } catch (err) {
      console.error("Report failed", err);
      // optionally show an error
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{
        flex: 1, justifyContent: "center", alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.6)"
      }}>
        <View style={{
          width: "86%", padding: 18, borderRadius: 12, backgroundColor: "#0f0f14"
        }}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18, marginBottom: 12 }}>
            Report message
          </Text>

          {REASONS.map((r) => (
            <TouchableOpacity key={r} onPress={() => setReason(r)} style={{
              padding: 8, marginVertical: 6, borderRadius: 8,
              backgroundColor: r === reason ? "#7c3aed" : "#1a1a25"
            }}>
              <Text style={{ color: "#fff" }}>{r}</Text>
            </TouchableOpacity>
          ))}

          <TextInput
            placeholder="Details (optional)"
            placeholderTextColor="#aaa"
            value={details}
            onChangeText={setDetails}
            style={{
              backgroundColor: "#15151b",
              color: "#fff",
              padding: 10,
              borderRadius: 8,
              marginTop: 10
            }}
          />

          <View style={{ flexDirection: "row", marginTop: 12, justifyContent: "space-between" }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 10 }}>
              <Text style={{ color: "#c084fc" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} style={{
              backgroundColor: "#7c3aed", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8
            }}>
              <Text style={{ color: "white" }}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
