import {SerializedSeeTopWildlingCardGameState} from "../common/ingame-game-state/action-game-state/use-raven-game-state/see-top-wildling-card-game-state/SeeTopWildlingCardGameState";
import {SerializedGameState} from "../common/GameState";
import {SerializedUnit} from "../common/ingame-game-state/game-data-structure/Unit";
import {SerializedUser} from "../server/User";
import {HouseCardState, SerializedHouseCard} from "../common/ingame-game-state/game-data-structure/house-card/HouseCard";
import {GameLogData} from "../common/ingame-game-state/game-data-structure/GameLog";
import {UserSettings} from "./ClientMessage";
import { SerializedWesterosCard } from "../common/ingame-game-state/game-data-structure/westeros-card/WesterosCard";
import { SerializedVote } from "../common/ingame-game-state/vote-system/Vote";
import { CrowKillersStep } from "../common/ingame-game-state/westeros-game-state/wildlings-attack-game-state/crow-killers-wildling-victory-game-state/CrowKillersWildlingVictoryGameState";
import HouseCardModifier from "../common/ingame-game-state/game-data-structure/house-card/HouseCardModifier";
import { CombatStats } from "../common/ingame-game-state/action-game-state/resolve-march-order-game-state/combat-game-state/CombatGameState";
import { DraftStep } from "../common/ingame-game-state/draft-house-cards-game-state/DraftHouseCardsGameState";

export type ServerMessage = NewUser | HouseChosen | AuthenticationResponse | OrderPlaced | PlayerReady | PlayerUnready
    | HouseCardChosen | CombatImmediatelyKilledUnits | SupportDeclared | SupportRefused | NewTurn | RemovePlacedOrder
    | MoveUnits | CombatChangeArmy
    | UnitsWounded | ChangeCombatHouseCard | BeginSeeTopWildlingCard
    | RavenOrderReplaced | RevealTopWildlingCard | HideTopWildlingCard | ProceedWesterosCard | ChangeGarrison
    | BiddingBegin | BidDone | BiddingNextTrack | GameStateChange | SupplyAdjusted
    | ChangeControlPowerToken | ChangePowerToken | ChangeWildlingStrength | AddGameLog | RevealWildlingCard
    | RemoveUnits | AddUnits | ChangeTracker | ActionPhaseChangeOrder | ChangeStateHouseCard
    | SettingsChanged | ChangeValyrianSteelBladeUse |  NewPrivateChatRoom | GameSettingsChanged
    | UpdateWesterosDecks | UpdateConnectionStatus | VoteStarted | VoteCancelled | VoteDone | PlayerReplaced
    | CrowKillersStepChanged | ManipulateCombatHouseCard | ChangeCombatTidesOfBattleCard
    | VassalRelations | UpdateHouseCardModifier | UpdateHouseCards | UpdateHouseCardsForDrafting | UpdateCombatStats
    | UpdateDraftState | RevealBids | UpdateMaxTurns | PasswordResponse | ReplacedByVassal | UpdateDeletedHouseCards
    | LoyaltyTokenGained | LoyaltyTokenPlaced | DrangonStrengthTokenRemoved;

interface AuthenticationResponse {
    type: "authenticate-response";
    userId: string;
    game: any;
}

interface NewUser {
    type: "new-user";
    user: SerializedUser;
}

interface HouseChosen {
    type: "house-chosen";
    players: [string, string][];
}

interface AddGameLog {
    type: "add-game-log";
    data: GameLogData;
    time: number;
}

interface OrderPlaced {
    type: "order-placed";
    order: number | null;
    region: string;
}

interface RemovePlacedOrder {
    type: "remove-placed-order";
    regionId: string;
}

interface PlayerReady {
    type: "player-ready";
    userId: string;
}

interface PlayerUnready {
    type: "player-unready";
    userId: string;
}

interface SupportDeclared {
    type: "support-declared";
    houseId: string;
    supportedHouseId: string | null;
}

interface SupportRefused {
    type: "support-refused";
    houseId: string;
}

interface HouseCardChosen {
    type: "house-card-chosen";
    houseId: string;
    houseCardId: string | null;
}

interface ChangeCombatHouseCard {
    type: "change-combat-house-card";
    houseCardIds: [string, string | null][];
}

interface ChangeCombatTidesOfBattleCard {
    type: "change-combat-tides-of-battle-card";
    tidesOfBattleCardIds: [string, string | null][];
}

interface ManipulateCombatHouseCard {
    type: "manipulate-combat-house-card";
    manipulatedHouseCards: [string, SerializedHouseCard][];
}

interface CombatImmediatelyKilledUnits {
    type: "combat-immediately-killed-units";
    regionId: string;
    unitIds: number[];
}

interface CombatChangeArmy {
    type: "combat-change-army";
    house: string;
    region: string;
    army: number[];
}

interface ChangeStateHouseCard {
    type: "change-state-house-card";
    houseId: string;
    cardIds: string[];
    state: HouseCardState;
}

interface UnitsWounded {
    type: "units-wounded";
    regionId: string;
    unitIds: number[];
}

interface BeginSeeTopWildlingCard {
    type: "begin-see-top-wildling-card";
    serializedSeeTopWildlingCardGameState: SerializedSeeTopWildlingCardGameState;
}

interface RavenOrderReplaced {
    type: "raven-order-replaced";
    regionId: string;
    orderId: number;
}

interface RevealTopWildlingCard {
    type: "reveal-top-wildling-card";
    cardId: number;
    houseId: string;
}

interface HideTopWildlingCard {
    type: "hide-top-wildling-card";
}

interface ProceedWesterosCard {
    type: "proceed-westeros-card";
    currentCardI: number;
}

interface BiddingBegin {
    type: "bidding-begin";
}

interface BidDone {
    type: "bid-done";
    houseId: string;
    value: number;
}

interface GameStateChange {
    type: "game-state-change";
    level: number;
    serializedGameState: SerializedGameState;
}

interface SupplyAdjusted {
    type: "supply-adjusted";
    supplies: [string, number][];
}

interface ChangeControlPowerToken {
    type: "change-control-power-token";
    regionId: string;
    houseId: string | null;
}

interface ChangePowerToken {
    type: "change-power-token";
    houseId: string;
    powerTokenCount: number;
}

interface AddUnits {
    type: "add-units";
    units: [string, SerializedUnit[]][];
}

interface ChangeWildlingStrength {
    type: "change-wildling-strength";
    wildlingStrength: number;
}

interface RevealWildlingCard {
    type: "reveal-wildling-card";
    wildlingCard: number;
}

interface RemoveUnits {
    type: "remove-units";
    regionId: string;
    unitIds: number[];
}

interface ChangeTracker {
    type: "change-tracker";
    trackerI: number;
    tracker: string[];
}

interface ActionPhaseChangeOrder {
    type: "action-phase-change-order";
    region: string;
    order: number | null;
}

interface ChangeGarrison {
    type: "change-garrison";
    region: string;
    newGarrison: number;
}

interface MoveUnits {
    type: "move-units";
    from: string;
    to: string;
    units: number[];
}

interface NewTurn {
    type: "new-turn";
}

interface SettingsChanged {
    type: "settings-changed";
    user: string;
    settings: UserSettings;
}

interface ChangeValyrianSteelBladeUse {
    type: "change-valyrian-steel-blade-use";
    used: boolean;
}

interface BiddingNextTrack {
    type: "bidding-next-track";
    nextTrack: number;
}

interface NewPrivateChatRoom {
    type: "new-private-chat-room";
    users: string[];
    roomId: string;
    initiator: string;
}

interface GameSettingsChanged {
    type: "game-settings-changed";
    settings: any;
}

interface UpdateWesterosDecks {
    type: "update-westeros-decks";
    westerosDecks: SerializedWesterosCard[][];
}

interface UpdateConnectionStatus {
    type: "update-connection-status";
    user: string;
    status: boolean;
}

interface VoteStarted {
    type: "vote-started";
    vote: SerializedVote;
}

interface VoteCancelled {
    type: "vote-cancelled";
    vote: string;
}

interface VoteDone {
    type: "vote-done";
    vote: string;
    voter: string;
    choice: boolean;
}

interface PlayerReplaced {
    type: "player-replaced";
    oldUser: string;
    newUser?: string ;
}

interface CrowKillersStepChanged {
    type: "crow-killers-step-changed";
    newStep: CrowKillersStep;
}

interface VassalRelations {
    type: "vassal-relations";
    vassalRelations: [string, string][];
}

interface UpdateHouseCardModifier {
    type: "update-house-card-modifier";
    id: string;
    modifier: HouseCardModifier;
}

interface UpdateHouseCards {
    type: "update-house-cards";
    house: string;
    houseCards: SerializedHouseCard[];
}

interface UpdateHouseCardsForDrafting {
    type: "update-house-cards-for-drafting";
    houseCards: SerializedHouseCard[];
}

interface UpdateCombatStats {
    type: "update-combat-stats";
    stats: CombatStats[];
}

interface UpdateDraftState {
    type: "update-draft-state";
    rowIndex: number;
    columnIndex: number;
    draftStep: DraftStep;
}

interface RevealBids {
    type: "reveal-bids";
    bids: [number, string[]][];
}

interface UpdateMaxTurns {
    type: "update-max-turns";
    maxTurns: number;
}

interface PasswordResponse {
    type: "password-response";
    password: string;
}

interface ReplacedByVassal {
    type: "replaced-by-vassal";
}

interface UpdateDeletedHouseCards {
    type: "update-deleted-house-cards";
    houseCards: SerializedHouseCard[];
}

interface LoyaltyTokenGained {
    type: "loyalty-token-gained";
    house: string;
    newLoyaltyTokenCount: number;
    region: string;
}

interface LoyaltyTokenPlaced {
    type: "loyalty-token-placed";
    region: string;
    newLoyaltyTokenCount: number;
}

interface DrangonStrengthTokenRemoved {
    type: "dragon-strength-token-removed";
    fromRound: number;
}