import { GrpcClient } from "@mitch528/react-native-grpc";

function UserGRPClientTransport() {
    const nativeClientInstance = GrpcClient;

    nativeClientInstance.setHost('rpc.yarsha.app');
    nativeClientInstance.setInsecure(false);

    return nativeClientInstance;
}

function localGRPClient() {
    const nativeClientInstance = GrpcClient;

    nativeClientInstance.setHost('192.168.0.102:50065');
    nativeClientInstance.setInsecure(true);

    return nativeClientInstance;
}

const UserGRPClient = UserGRPClientTransport();

export { UserGRPClient, localGRPClient };