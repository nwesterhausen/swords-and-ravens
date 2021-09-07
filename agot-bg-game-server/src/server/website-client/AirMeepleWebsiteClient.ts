import { RequestAPI } from "request";
import requestPromise from "request-promise";
import { StatusCodeError } from "request-promise/errors";
import User from "../User";
import WebsiteClient, { StoredGameData, StoredUserData } from "./WebsiteClient";

export default class AirMeepleWebsiteClient implements WebsiteClient {
    airMeepleApiBaseUrl: string;
    airMeepleApiUsername: string;
    airMeepleApiPassword: string;
    // Don't really know what generic types should be specified here
    request: RequestAPI<any, any, any>;

    constructor() {
        this.airMeepleApiBaseUrl = process.env.AIRMEEPLE_API_BASE_URL || "http://localhost:8001/api/game_server";
        this.airMeepleApiUsername = process.env.AIRMEEPLE_API_USERNAME || "DummyUsername";
        this.airMeepleApiPassword = process.env.AIRMEEPLE_API_PASSWORD || "DummyPassword";

        this.request = requestPromise.defaults({
            json: true,
            auth: {
                user: this.airMeepleApiUsername,
                pass: this.airMeepleApiPassword,
                sendImmediately: true
            }
        })
    }

    async getUser(matchId: string, userId: string): Promise<StoredUserData | null> {
        try {
            const response = await this.request.get(`${this.airMeepleApiBaseUrl}/user/${userId}/${matchId}`);

            return {
                id: response.id,
                name: response.username,
                token: response.auth_token,
                profileSettings: {
                    muted: false,
                    houseNamesForChat: true,
                    mapScrollbar: true,
                    responsiveLayout: true
                }
            };
        } catch (e) {
            if (e instanceof StatusCodeError) {
                if (e.statusCode == 404) {
                    return null;
                }
            }

            throw e;
        }
    }
    
    async getGame(gameId: string): Promise<StoredGameData | null> {
        try {
            const response = await this.request.get(`${this.airMeepleApiBaseUrl}/match/${gameId}`);

            return {
                id: response.id,
                name: response.name,
                ownerId: response.owner,
                serializedGame: response.serialized_game,
                version: response.serialized_game ? response.serialized_game["version"] : null
            };
        } catch (e) {
            if (e instanceof StatusCodeError) {
                if (e.statusCode == 404) {
                    return null;
                }
            }

            throw e;
        }
    }
    
    async saveGame(gameId: string, serializedGame: object, viewOfGame: object, players: { userId: string; data: object; }[], state: string, version: string): Promise<void> {
        // @ts-ignore
        serializedGame["version"] = version;

        await this.request.patch(`${this.airMeepleApiBaseUrl}/match/${gameId}`, {
            body: {
                serialized_game: serializedGame,
                status: state,
                players: players.map(p => ({user: p.userId, metadata: p.data})),
                metadata: viewOfGame,
                // @ts-expect-error serializedGame is an object, but will always contain those properties
                max_players: serializedGame.gameSettings.playerCount,
            }
        });
    }
    
    notifyReadyToStart(gameId: string, userIds: string[]): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
    notifyYourTurn(gameId: string, userIds: string[]): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
    notifyBattleResults(gameId: string, userIds: string[]): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
    notifyNewVote(gameId: string, userIds: string[]): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
    notifyGameEnded(gameId: string, userIds: string[]): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
    async createPublicChatRoom(name: string): Promise<string> {
        // This should do nothing since AirMeeple automatically create a public chat room for each match
        return "dumb-room-id";
    }
    
    createPrivateChatRoom(users: User[], name: string): Promise<string> {
        throw new Error("Method not implemented.");
    }
}