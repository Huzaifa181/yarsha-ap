import {useToggleMuteChatMutation} from '@/hooks/domain/mute-chat/useMuteChat';
import {useTogglePinChatMutation} from '@/hooks/domain/pin-chat/usePinChat';
import {useDeleteGroupChatMutation} from '@/hooks/domain/delete-chat/useDeleteChat';
import {generateRequestHeader} from '@/utils/requestHeaderGenerator';
import {useSelector} from 'react-redux';
import {RootState} from '@/store';

export function useChatActions() {
  const token = useSelector((state: RootState) => state.accessToken.authToken);
  const [toggleMuteChat] = useToggleMuteChatMutation();
  const [togglePinChat] = useTogglePinChatMutation();
  const [deleteGroupChat] = useDeleteGroupChatMutation();

  async function muteChat(groupId: string) {
    const RequestHeader = await generateRequestHeader();
    await toggleMuteChat({
      RequestHeader,
      AccessToken: token,
      Body: {ChatId: groupId},
    }).unwrap();
  }

  async function pinChat(groupId: string) {
    const RequestHeader = await generateRequestHeader();
    await togglePinChat({
      RequestHeader,
      AccessToken: token,
      Body: {ChatId: groupId},
    }).unwrap();
  }

  async function deleteChat(groupId: string) {
    const RequestHeader = await generateRequestHeader();
    await deleteGroupChat({
      RequestHeader,
      AccessToken: token,
      Body: {ChatId: groupId},
    }).unwrap();
  }

  return {muteChat, pinChat, deleteChat};
}
