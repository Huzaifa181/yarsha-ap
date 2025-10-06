import { SafeScreen } from '@/components/template';
import { useFetchGroupChatDetailQuery } from '@/hooks/domain/fetch-chat-details/useFetchChatDetails';
import { useTheme } from '@/theme';
import { SafeScreenRouteProp } from '@/types';
import { useRoute } from '@react-navigation/native';
import React, { FC } from 'react';
import { FlatList, View } from 'react-native';
import MemberRowItem from './shared/MemberRowItem';

interface IProps { }

/**
* @author Nitesh Raj Khanal
* @function @AddAdmins
**/

const AddAdmins: FC<IProps> = (props) => {
    const { layout, gutters } = useTheme();

    const route = useRoute<SafeScreenRouteProp & { params: { groupId: string } }>();
    const { groupId } = route.params;

    const { data: groupChatDetails } = useFetchGroupChatDetailQuery({ ChatId: groupId })

    const onlyMembers = groupChatDetails?.participants.filter(
        (participant) => participant.role === 'member'
    ) as { fullName: string; username: string; backgroundColor: string; address: string; id: string; profilePicture: string; lastActive: string; status: "online" | "offline"; role: "member" | "admin" | "creator"; }[];

    console.log("onlyMembers", onlyMembers);

    return (
        <SafeScreen>

            <View style={[layout.flex_1, gutters.paddingHorizontal_12, gutters.paddingVertical_12]}>
                <FlatList
                    data={onlyMembers}
                    keyExtractor={(item) => item.id}
                    scrollEventThrottle={16}
                    contentContainerStyle={[layout.flexGrow, layout.justifyStart, layout.itemsStart]}
                    renderItem={({ item }) => <MemberRowItem participant={item} groupId={groupId}/>}
                />
            </View>
        </SafeScreen>
    )
}

export default React.memo(AddAdmins)
