import type React from "react"
import { View, TouchableOpacity, StyleSheet } from "react-native"
import { TextVariant } from "@/components/atoms"
import { ReactionPayload } from "../../types/message-types"

interface MessageReactionsProps {
  reactions: ReactionPayload[]
  onOpenReactionSheet: (emoji: string, users: ReactionPayload[]) => void
}

const MessageReactions: React.FC<MessageReactionsProps> = ({ reactions, onOpenReactionSheet }) => {
  if (!reactions || reactions.length === 0) return null

  const getGroupedReactions = (reactions: ReactionPayload[]) => {
    const grouped: { [emoji: string]: ReactionPayload[] } = {}

    reactions.forEach((reaction) => {
      if (!grouped[reaction.reaction]) {
        grouped[reaction.reaction] = []
      }
      grouped[reaction.reaction].push(reaction)
    })

    return Object.entries(grouped).map(([emoji, users]) => ({ emoji, users }))
  }

  return (
    <View style={styles.container}>
      {getGroupedReactions(reactions).map(({ emoji, users }) => (
        <TouchableOpacity
          key={emoji}
          onLongPress={() => onOpenReactionSheet(emoji, users)}
          style={styles.reactionBubble}
        >
          <TextVariant style={styles.emojiText}>{emoji}</TextVariant>
          <TextVariant style={styles.countText}>{users.length}</TextVariant>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginTop: 4,
    flexWrap: "wrap",
  },
  reactionBubble: {
    backgroundColor: "#eee",
    borderRadius: 14,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
    marginTop: 4,
  },
  emojiText: {
    fontSize: 16,
  },
  countText: {
    fontSize: 12,
    marginLeft: 4,
  },
})

export default MessageReactions
