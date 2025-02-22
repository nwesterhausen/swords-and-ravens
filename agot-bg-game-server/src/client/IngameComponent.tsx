import * as React from "react";
import {Component, ReactNode} from "react";
import ResizeObserver from 'resize-observer-polyfill';
import GameClient from "./GameClient";
import {observer} from "mobx-react";
import IngameGameState from "../common/ingame-game-state/IngameGameState";
import MapComponent, { MAP_HEIGHT } from "./MapComponent";
import MapControls from "./MapControls";
import ListGroup from "react-bootstrap/ListGroup";
import ListGroupItem from "react-bootstrap/ListGroupItem";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import renderChildGameState from "./utils/renderChildGameState";
import WesterosGameState from "../common/ingame-game-state/westeros-game-state/WesterosGameState";
import WesterosGameStateComponent from "./game-state-panel/WesterosGameStateComponent";
import PlanningGameState from "../common/ingame-game-state/planning-game-state/PlanningGameState";
import PlanningComponent from "./game-state-panel/PlanningComponent";
import ActionGameState from "../common/ingame-game-state/action-game-state/ActionGameState";
import ActionComponent from "./game-state-panel/ActionComponent";
import * as _ from "lodash";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faStar} from "@fortawesome/free-solid-svg-icons/faStar";
import {faStickyNote} from "@fortawesome/free-solid-svg-icons/faStickyNote";
import Tooltip from "react-bootstrap/Tooltip";
import stoneThroneImage from "../../public/images/icons/stone-throne.svg";
import cancelImage from "../../public/images/icons/cancel.svg";
import truceImage from "../../public/images/icons/truce.svg";
import ravenImage from "../../public/images/icons/raven.svg";
import diamondHiltImage from "../../public/images/icons/diamond-hilt.svg";
import diamondHiltUsedImage from "../../public/images/icons/diamond-hilt-used.svg";
import hourglassImage from "../../public/images/icons/hourglass.svg";
import mammothImage from "../../public/images/icons/mammoth.svg";
import spikedDragonHeadImage from "../../public/images/icons/spiked-dragon-head.svg";
import chatBubble from "../../public/images/icons/chat-bubble.svg";
import speaker from "../../public/images/icons/speaker.svg";
import speakerOff from "../../public/images/icons/speaker-off.svg";
import House from "../common/ingame-game-state/game-data-structure/House";
import marked from "marked";
import GameLogListComponent from "./GameLogListComponent";
import Game, { MAX_WILDLING_STRENGTH } from "../common/ingame-game-state/game-data-structure/Game";
import GameEndedGameState from "../common/ingame-game-state/game-ended-game-state/GameEndedGameState";
import GameEndedComponent from "./game-state-panel/GameEndedComponent";
import Nav from "react-bootstrap/Nav";
import Tab from "react-bootstrap/Tab";
import ChatComponent from "./chat-client/ChatComponent";
import InfluenceIconComponent from "./game-state-panel/utils/InfluenceIconComponent";
import SupplyTrackComponent from "./game-state-panel/utils/SupplyTrackComponent";
import Dropdown from "react-bootstrap/Dropdown";
import User from "../server/User";
import Player from "../common/ingame-game-state/Player";
import {observable} from "mobx";
import classNames from "classnames";
import {Channel, Message} from "./chat-client/ChatClient";
// @ts-expect-error Somehow this module cannot be found while it is
import ScrollToBottom from "react-scroll-to-bottom";
import GameSettingsComponent from "./GameSettingsComponent";
import VoteComponent from "./VoteComponent";
import IngameCancelledComponent from "./game-state-panel/IngameCancelledComponent";
import CancelledGameState from "../common/cancelled-game-state/CancelledGameState";
import joinReactNodes from "./utils/joinReactNodes";
import NoteComponent from "./NoteComponent";
import HouseRowComponent from "./HouseRowComponent";
import UserSettingsComponent from "./UserSettingsComponent";
import { GameSettings } from '../common/EntireGame';
import {isMobile} from 'react-device-detect';
import DraftHouseCardsGameState from "../common/ingame-game-state/draft-house-cards-game-state/DraftHouseCardsGameState";
import DraftHouseCardsComponent from "./game-state-panel/DraftHouseCardsComponent";
import ThematicDraftHouseCardsGameState from "../common/ingame-game-state/thematic-draft-house-cards-game-state/ThematicDraftHouseCardsGameState";
import ThematicDraftHouseCardsComponent from "./game-state-panel/ThematicDraftHouseCardsComponent";
import ClashOfKingsGameState from "../common/ingame-game-state/westeros-game-state/clash-of-kings-game-state/ClashOfKingsGameState";
import houseCardsBackImages from "./houseCardsBackImages";
import houseInfluenceImages from "./houseInfluenceImages";
import houseOrderImages from "./houseOrderImages";
import housePowerTokensImages from "./housePowerTokensImages";
import unitImages from "./unitImages";
import DraftInfluencePositionsGameState from "../common/ingame-game-state/draft-influence-positions-game-state/DraftInfluencePositionsGameState";
import DraftInfluencePositionsComponent from "./game-state-panel/DraftInfluencePositionsComponent";
import { preventOverflow } from "@popperjs/core";
import { OverlayChildren } from "react-bootstrap/esm/Overlay";
import { faChevronCircleLeft, faChevronCircleRight } from "@fortawesome/free-solid-svg-icons";
import sleep from "../utils/sleep";
import joinNaturalLanguage from "./utils/joinNaturalLanguage";

interface ColumnOrders {
    gameStateColumn: number;
    mapColumn: number;
    housesInfosColumn: number;
    collapseButtonColumn: number;
}

interface IngameComponentProps {
    gameClient: GameClient;
    gameState: IngameGameState;
}

const BOTTOM_MARGIN_PX = 35;
const GAME_STATE_GAME_LOG_RATIO = 0.65;
const GAME_LOG_MIN_HEIGHT = 240;
const HOUSES_PANEL_MIN_HEIGHT = 430;
const MAP_MIN_HEIGHT = Math.trunc(MAP_HEIGHT / 2);

@observer
export default class IngameComponent extends Component<IngameComponentProps> {
    mapControls: MapControls = new MapControls();
    @observable currentOpenedTab = this.user?.settings.lastOpenedTab ?? "chat";
    @observable windowHeight: number | null = null;
    @observable gameStatePanelMaxHeight: number | null = null;
    @observable gameLogHeight: number = GAME_LOG_MIN_HEIGHT;
    @observable gameLogMinHeight: number = GAME_LOG_MIN_HEIGHT;
    @observable housesMaxHeight: number | null = null;
    @observable housesInfosCollapsed = this.props.gameClient.authenticatedUser?.settings.tracksColumnCollapsed ?? false;
    resizeObserver: ResizeObserver | null = null;

    get game(): Game {
        return this.ingame.game;
    }

    get gameSettings(): GameSettings {
        return this.ingame.entireGame.gameSettings;
    }

    get user(): User | null {
        return this.props.gameClient.authenticatedUser ? this.props.gameClient.authenticatedUser : null;
    }

    get ingame(): IngameGameState {
        return this.props.gameState;
    }

    get authenticatedPlayer(): Player | null {
        return this.props.gameClient.authenticatedPlayer;
    }

    get tracks(): {name: string; trackToShow: (House | null)[]; realTrack: House[]; stars: boolean}[] {
        const influenceTracks: (House | null)[][] = this.game.influenceTracks.map(track => Array.from(track));
        if (this.ingame.hasChildGameState(ClashOfKingsGameState)) {
            const cok = this.ingame.getChildGameState(ClashOfKingsGameState) as ClashOfKingsGameState;
            for (let i = cok.currentTrackI; i < influenceTracks.length; i++) {
                influenceTracks[i] = influenceTracks[i].map((h, j) => i == 0 && j == 0 ? h : null)
            }
        }
        return [
            {name: "Iron Throne", trackToShow: influenceTracks[0], realTrack: this.game.influenceTracks[0], stars: false},
            {name: "Fiefdoms", trackToShow: influenceTracks[1], realTrack: this.game.influenceTracks[1], stars: false},
            {name: "King's Court", trackToShow: influenceTracks[2], realTrack: this.game.influenceTracks[2], stars: true},
        ]
    }

    get gameStatePanel(): HTMLElement {
        return document.getElementById('game-state-panel') as HTMLElement;
    }

    get mapComponent(): HTMLElement | null { // The map is hidden from the DOM in drafting mode, therefore this element can be null
        return document.getElementById('map-component');
    }

    get gameLogPanel(): HTMLElement {
        return document.getElementById('game-log-panel') as HTMLElement;
    }

    get housesPanel(): HTMLElement | null {
        return document.getElementById('houses-panel') as HTMLElement;
    }

    get gameControlsRow(): HTMLElement | null { // Spectators don' see this game controls, therefore this element can be null
        return document.getElementById('game-controls');
    }

    constructor(props: IngameComponentProps) {
        super(props);
        // Check for Dance with Dragons house cards
        if (props.gameState.entireGame.gameSettings.adwdHouseCards ||
            props.gameState.entireGame.gameSettings.setupId == "a-dance-with-dragons") {
            // Replace Stark images with Bolton images for DwD
            houseCardsBackImages.set("stark", houseCardsBackImages.get("bolton"));
            houseInfluenceImages.set("stark", houseInfluenceImages.get("bolton"));
            houseOrderImages.set("stark", houseOrderImages.get("bolton"));
            housePowerTokensImages.set("stark", housePowerTokensImages.get("bolton"));
            unitImages.set("stark", unitImages.get("bolton"));

            const boltons = this.props.gameState.game.houses.tryGet("stark", null);
            if (boltons) {
                boltons.name = "Bolton";
                boltons.color = "#c59699"
            }
        }
    }

    render(): ReactNode {
        const mobileDevice = isMobile;
        const draftHouseCards = this.props.gameState.childGameState instanceof DraftHouseCardsGameState;

        const columnOrders = this.getColumnOrders(mobileDevice, this.user?.settings.responsiveLayout ?? false);

        const mapStyle = {
            height: (this.windowHeight != null && this.mapComponent != null) ? (this.windowHeight - this.mapComponent.getBoundingClientRect().top - BOTTOM_MARGIN_PX) : "auto",
            overflowY: (this.windowHeight != null ? "scroll" : "visible") as any,
            maxHeight: MAP_HEIGHT,
            minHeight: MAP_MIN_HEIGHT
        };

        const collapseIcon = columnOrders.collapseButtonColumn == 1 ?
            this.housesInfosCollapsed ? faChevronCircleLeft : faChevronCircleRight
            : this.housesInfosCollapsed ? faChevronCircleRight : faChevronCircleLeft;

        return (
            <>
                <Col xs={{order: columnOrders.gameStateColumn}} style={{minWidth: "470px"}}>
                    {this.renderGameStateColumn()}
                </Col>
                {!draftHouseCards && <Col xs={{span: "auto", order: columnOrders.mapColumn}}>
                    <div id="map-component" style={mapStyle}>
                        <MapComponent
                            gameClient={this.props.gameClient}
                            ingameGameState={this.props.gameState}
                            mapControls={this.mapControls}
                        />
                    </div>
                </Col>}
                {!mobileDevice &&
                <Col xs={{span: "auto", order: columnOrders.collapseButtonColumn}} className="px-0">
                    <button className="btn btn-sm p-0" onClick={async() => {
                        this.housesInfosCollapsed = !this.housesInfosCollapsed;
                        if (this.props.gameClient.authenticatedUser) {
                            this.props.gameClient.authenticatedUser.settings.tracksColumnCollapsed = this.housesInfosCollapsed;
                            this.props.gameClient.authenticatedUser.syncSettings();
                        }
                        await sleep(750);
                        this.onWindowResize();
                    }}>
                        <FontAwesomeIcon icon={collapseIcon} />
                    </button>
                </Col>}
                {(!this.housesInfosCollapsed || mobileDevice) && (
                <Col xs={{ span: "auto", order: columnOrders.housesInfosColumn }} id="tracks-houses-column">
                    {this.renderHousesColumn(mobileDevice)}
                </Col>)}
            </>
        );
    }

    renderHousesColumn(mobileDevice: boolean): ReactNode {
        const {result: canLaunchCancelGameVote, reason: canLaunchCancelGameVoteReason} = this.props.gameState.canLaunchCancelGameVote(this.authenticatedPlayer);
        const {result: canLaunchEndGameVote, reason: canLaunchEndGameVoteReason} = this.props.gameState.canLaunchEndGameVote(this.authenticatedPlayer);

        const connectedSpectators = this.getConnectedSpectators();

        const housesPanelStyle = {
            maxHeight: this.housesMaxHeight == null ? "none": `${this.housesMaxHeight}px`,
            overflowY: (this.housesMaxHeight == null ? "visible" : "scroll") as any,
            minHeight: mobileDevice ? "auto" : `${HOUSES_PANEL_MIN_HEIGHT}px`
        };

        return (
            <>
                <Row className="stackable">
                    <Col>
                        <Card>
                            <ListGroup variant="flush">
                                {this.tracks.map(({ name, trackToShow, realTrack, stars }, i) => (
                                    <ListGroupItem key={`influence-track-${i}`} style={{ minHeight: "61px" }}>
                                        <Row className="align-items-center">
                                            <Col xs="auto" className="text-center" style={{ width: "46px" }}>
                                                <OverlayTrigger
                                                    overlay={
                                                        <Tooltip id={`tooltip-tracker-${i}`}>
                                                            {i == 0 ? (
                                                                <>
                                                                    <b>Iron Throne Track</b><br />
                                                                    All ties (except military ones) are decided by the holder
                                                                    of the Iron Throne.<br />
                                                                    Turn order is decided by this tracker.
                                                                </>
                                                            ) : i == 1 ? (
                                                                <>
                                                                    <b>Fiefdoms Track</b><br />
                                                                    Once per round, the holder of Valyrian Steel Blade can use the blade
                                                                    to increase by one the combat strength of his army in a combat.<br />
                                                                    In case of a tie in a combat, the winner is the house which is
                                                                    the highest in this tracker.<br /><br />
                                                                    {this.props.gameState.game.valyrianSteelBladeUsed ? (
                                                                        <>The Valyrian Steel Blade has been used this round.</>
                                                                    ) : (
                                                                        <>The Valyrian Steel Blade is available.</>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <b>Kings&apos;s Court Track</b><br />
                                                                    At the end of the Planning Phase, the holder of the Raven may choose
                                                                    to either change one of his placed order, or to look at the top card of the
                                                                    Wildling deck and decide whether to leave it at the top or to
                                                                    place it at the bottom of the deck.
                                                                </>
                                                            )}
                                                        </Tooltip>
                                                    }
                                                    placement="right"
                                                >
                                                    <img src={i == 0 ? stoneThroneImage : i == 1 ? this.game.valyrianSteelBladeUsed ? diamondHiltUsedImage : diamondHiltImage : ravenImage} width={32} />
                                                </OverlayTrigger>
                                            </Col>
                                            {trackToShow.map((h, j) => (
                                                <Col xs="auto" key={`track_${i}_${h?.id ?? j}`}>
                                                    <InfluenceIconComponent
                                                        house={h}
                                                        ingame={this.props.gameState}
                                                        track={realTrack}
                                                        name={name}
                                                    />
                                                    <div className="tracker-star-container">
                                                        {stars && i < this.game.starredOrderRestrictions.length && (
                                                            _.range(0, this.game.starredOrderRestrictions[j]).map(k => (
                                                                <div key={`stars_${h?.id ?? j}_${k}`}>
                                                                    <FontAwesomeIcon
                                                                        style={{ color: "#ffc107", fontSize: "9px" }}
                                                                        icon={faStar} />
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </Col>
                                            ))}
                                        </Row>
                                    </ListGroupItem>
                                ))}
                                <ListGroupItem style={{ minHeight: "130px" }}>
                                    <SupplyTrackComponent
                                        supplyRestrictions={this.game.supplyRestrictions}
                                        houses={this.game.houses}
                                    />
                                </ListGroupItem>
                            </ListGroup>
                        </Card>
                    </Col>
                </Row>
                <Row className="stackable">
                    <Col>
                        <Card>
                            <div style={housesPanelStyle}>
                                <Card.Body id="houses-panel" className="no-space-around">
                                    <ListGroup variant="flush">
                                        {this.props.gameState.game.getPotentialWinners().map(h => (
                                            <HouseRowComponent
                                                key={h.id}
                                                gameClient={this.props.gameClient}
                                                ingame={this.props.gameState}
                                                house={h}
                                                mapControls={this.mapControls}
                                            />
                                        ))}
                                        <ListGroupItem className="text-center font-italic">
                                            <small>
                                                {connectedSpectators.length > 0 ? (
                                                    <>Spectators: {joinReactNodes(this.getConnectedSpectators().map(u => <strong key={u.id}>{u.name}</strong>), ", ")}</>
                                                ) : (
                                                    <>No spectators</>
                                                )}
                                            </small>
                                        </ListGroupItem>
                                    </ListGroup>
                                </Card.Body>
                            </div>
                        </Card>
                    </Col>
                </Row>
                {this.authenticatedPlayer && (
                    <Row id="game-controls">
                        <Col xs="auto" className="pb-0">
                            <button className="btn btn-outline-light btn-sm" onClick={() => this.props.gameClient.muted = !this.props.gameClient.muted}>
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip id="mute-tooltip">
                                            {this.props.gameClient.muted
                                                ? "Unmute"
                                                : "Mute"}
                                        </Tooltip>
                                    }
                                >
                                    <img src={this.props.gameClient.muted ? speakerOff : speaker} width={32} />
                                </OverlayTrigger>
                            </button>
                        </Col>
                        <Col xs="auto" className="pb-0">
                            <button
                                className="btn btn-outline-light btn-sm"
                                onClick={() => this.props.gameState.launchCancelGameVote()}
                                disabled={!canLaunchCancelGameVote}
                            >
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip id="cancel-game-vote-tooltip">
                                            {canLaunchCancelGameVote ? (
                                                "Launch a vote to cancel the game"
                                            ) : canLaunchCancelGameVoteReason == "only-players-can-vote" ? (
                                                "Only participating players can vote"
                                            ) : canLaunchCancelGameVoteReason == "already-existing" ? (
                                                "A vote to cancel the game is already ongoing"
                                            ) : canLaunchCancelGameVoteReason == "already-cancelled" ? (
                                                "Game has already been cancelled"
                                            ) : canLaunchCancelGameVoteReason == "already-ended" ? (
                                                "Game has already ended"
                                            ) : "Vote not possible"}
                                        </Tooltip>
                                    }
                                >
                                    <img src={cancelImage} width={32} />
                                </OverlayTrigger>
                            </button>
                        </Col>
                        <Col xs="auto" className="pb-0">
                            <button
                                className="btn btn-outline-light btn-sm"
                                onClick={() => this.props.gameState.launchEndGameVote()}
                                disabled={!canLaunchEndGameVote}
                            >
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip id="end-game-vote-tooltip">
                                            {canLaunchEndGameVote ? (
                                                "Launch a vote to end the game after the current round"
                                            ) : canLaunchEndGameVoteReason == "only-players-can-vote" ? (
                                                "Only participating players can vote"
                                            ) : canLaunchEndGameVoteReason == "already-last-turn" ? (
                                                "It is already the last round"
                                            ) : canLaunchEndGameVoteReason == "already-existing" ? (
                                                "A vote to end the game is already ongoing"
                                            ) : canLaunchEndGameVoteReason == "already-cancelled" ? (
                                                "Game has already been cancelled"
                                            ) : canLaunchEndGameVoteReason == "already-ended" ? (
                                                "Game has already ended"
                                            ) : "Vote not possible"}
                                        </Tooltip>}
                                >
                                    <img src={truceImage} width={32} />
                                </OverlayTrigger>
                            </button>
                        </Col>
                    </Row>)}
            </>)
    }

    renderGameStateColumn(): ReactNode {
        const phases: {name: string; gameState: any; component: typeof Component}[] = [
            {name: "Westeros", gameState: WesterosGameState, component: WesterosGameStateComponent},
            {name: "Planning", gameState: PlanningGameState, component: PlanningComponent},
            {name: "Action", gameState: ActionGameState, component: ActionComponent}
        ];

        const knowsWildlingCard = this.authenticatedPlayer != null &&
            this.authenticatedPlayer.house.knowsNextWildlingCard;
        const nextWildlingCard = this.game.wildlingDeck.find(c => c.id == this.game.clientNextWildlingCardId);

        const gameRunning = !(this.ingame.leafState instanceof GameEndedGameState) && !(this.ingame.leafState instanceof CancelledGameState);
        const roundWarning = gameRunning && (this.game.maxTurns - this.game.turn) == 1;
        const roundCritical = gameRunning && (this.game.turn == this.game.maxTurns);

        let wildlingsWarning = gameRunning && (this.game.wildlingStrength == MAX_WILDLING_STRENGTH - 2 || this.game.wildlingStrength == MAX_WILDLING_STRENGTH - 4);
        let wildlingsCritical = gameRunning && this.game.wildlingStrength == MAX_WILDLING_STRENGTH;

        let warningAndKnowsNextWildingCard = false;
        let criticalAndKnowsNextWildingCard = false;

        if (knowsWildlingCard && nextWildlingCard) {
            if (wildlingsWarning) {
                warningAndKnowsNextWildingCard = true;
                wildlingsWarning = false;
            }

            if (wildlingsCritical) {
                criticalAndKnowsNextWildingCard = true;
                wildlingsCritical = false;
            }
        }

        const gameStatePanelStyle = {
            maxHeight: this.gameStatePanelMaxHeight == null ? "none" : `${this.gameStatePanelMaxHeight}px`,
            overflowY: (this.gameStatePanelMaxHeight == null ? "visible" : "scroll") as any,
            paddingRight: "10px"
        };

        const border = this.props.gameClient.isOwnTurn() ?
            "warning" : this.props.gameState.childGameState instanceof CancelledGameState ?
            "danger" : undefined;

        return <Row className="mt-0">
            <Col xs={"12"} className="pt-0">
                <Card id="game-state-panel" border={border} style={gameStatePanelStyle}>
                    <Row>
                        <Col>
                            <ListGroup variant="flush">
                                {phases.some(phase => this.props.gameState.childGameState instanceof phase.gameState) && (
                                    <ListGroupItem>
                                        <OverlayTrigger
                                            overlay={this.renderRemainingWesterosCards()}
                                            delay={{ show: 250, hide: 100 }}
                                            placement="bottom"
                                            popperConfig={{ modifiers: [preventOverflow] }}
                                        >
                                            <Row className="justify-content-between">
                                                {phases.map((phase, i) => (
                                                    <Col xs="auto" key={i}>
                                                        {this.props.gameState.childGameState instanceof phase.gameState ? (
                                                            <strong className="weak-outline">{phase.name} phase</strong>
                                                        ) : (
                                                            <span className="text-muted">
                                                                {phase.name} phase
                                                            </span>
                                                        )}
                                                    </Col>
                                                ))}
                                            </Row>
                                        </OverlayTrigger>
                                    </ListGroupItem>
                                )}
                                {renderChildGameState(
                                    { mapControls: this.mapControls, ...this.props },
                                    _.concat(
                                        phases.map(phase => [phase.gameState, phase.component] as [any, typeof Component]),
                                        [[ThematicDraftHouseCardsGameState, ThematicDraftHouseCardsComponent]],
                                        [[DraftHouseCardsGameState, DraftHouseCardsComponent]],
                                        [[DraftInfluencePositionsGameState, DraftInfluencePositionsComponent]],
                                        [[GameEndedGameState, GameEndedComponent]],
                                        [[CancelledGameState, IngameCancelledComponent]]
                                    )
                                )}
                            </ListGroup>
                        </Col>
                        <Col xs="auto" className="mx-1 px-0">
                            <Col style={{ width: "28px", fontSize: "22px", textAlign: "center" }} className="px-0">
                                <Row className="mb-3 mx-0">
                                    <OverlayTrigger overlay={
                                        <Tooltip id="round-tooltip">
                                            <h6>Round {this.game.turn} / {this.game.maxTurns}</h6>
                                        </Tooltip>
                                    }
                                        placement="auto">
                                        <div>
                                            <img className={classNames(
                                                { "dye-warning": roundWarning },
                                                { "dye-critical": roundCritical })}
                                                src={hourglassImage} width={28} />
                                            <div style={{ color: roundWarning ? "#F39C12" : roundCritical ? "#FF0000" : undefined }}>{this.game.turn}</div>
                                        </div>
                                    </OverlayTrigger>
                                </Row>
                                <Row className="mx-0">
                                    <OverlayTrigger overlay={
                                        <Tooltip id="wildling-threat-tooltip">
                                            <h6>Wildling Threat</h6>{knowsWildlingCard && nextWildlingCard ?
                                                <><br /><br /><strong><u>{nextWildlingCard.type.name}</u></strong><br />
                                                    <strong>Lowest Bidder:</strong> {nextWildlingCard.type.wildlingVictoryLowestBidderDescription}<br />
                                                    <strong>Everyone Else:</strong> {nextWildlingCard.type.wildlingVictoryEverybodyElseDescription}<br /><br />
                                                    <strong>Highest Bidder:</strong> {nextWildlingCard.type.nightsWatchDescription}
                                                </>
                                                : <></>
                                            }
                                        </Tooltip>
                                    }
                                        placement="auto">
                                        <div>
                                            <img src={mammothImage} width={28} className={classNames(
                                                { "dye-warning": wildlingsWarning && !warningAndKnowsNextWildingCard },
                                                { "dye-critical": wildlingsCritical && !criticalAndKnowsNextWildingCard },
                                                { "wildling-highlight": knowsWildlingCard && !warningAndKnowsNextWildingCard && !criticalAndKnowsNextWildingCard},
                                                { "dye-warning-highlight": warningAndKnowsNextWildingCard},
                                                { "dye-critical-highlight": criticalAndKnowsNextWildingCard}
                                                )}
                                            />
                                            <div style={{ color: wildlingsWarning ? "#F39C12" : wildlingsCritical ? "#FF0000" : undefined }}>{this.game.wildlingStrength}</div>
                                        </div>
                                    </OverlayTrigger>
                                </Row>
                                {this.props.gameState.entireGame.gameSettings.playerCount >= 8 && <Row className="mx-0 mt-3">
                                    <OverlayTrigger overlay={this.renderDragonStrengthTooltip()}
                                        placement="auto">
                                        <div>
                                            <img src={spikedDragonHeadImage} width={28}/>
                                            <div>{this.game.currentDragonStrength}</div>
                                        </div>
                                    </OverlayTrigger>
                                </Row>}
                            </Col>
                        </Col>
                    </Row>
                </Card>
            </Col>
            <Col xs={"12"}>
                <Card>
                    <Tab.Container activeKey={this.currentOpenedTab}
                        onSelect={k => {
                            if (k) {
                                this.currentOpenedTab = k;
                            }
                            if (this.user) {
                                this.user.settings.lastOpenedTab = k;
                                this.user.syncSettings();
                            }
                        }}>
                        <Card.Header>
                            <Nav variant="tabs">
                                <Nav.Item>
                                    <Nav.Link eventKey="game-logs">Game Logs</Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <div className={classNames({ "new-event": this.publicChatRoom.areThereNewMessage })}>
                                        <Nav.Link eventKey="chat">
                                            Chat
                                        </Nav.Link>
                                    </div>
                                </Nav.Item>
                                {this.authenticatedPlayer && (
                                    <Nav.Item>
                                        <Nav.Link eventKey="note">
                                            <OverlayTrigger
                                                overlay={<Tooltip id="note">Personal note</Tooltip>}
                                                placement="auto"
                                            >
                                                <FontAwesomeIcon
                                                    style={{ color: "white" }}
                                                    icon={faStickyNote} />
                                            </OverlayTrigger>
                                        </Nav.Link>
                                    </Nav.Item>
                                )}
                                <Nav.Item>
                                    <Nav.Link eventKey="settings">
                                        Settings
                                    </Nav.Link>
                                </Nav.Item>
                                {this.getPrivateChatRooms().map(({ user, roomId }) => (
                                    <Nav.Item key={roomId}>
                                        <div className={classNames({ "new-event": this.getPrivateChatRoomForPlayer(user).areThereNewMessage })}>
                                            <Nav.Link eventKey={roomId}>
                                                {this.getUserDisplayName(user)}
                                            </Nav.Link>
                                        </div>
                                    </Nav.Item>
                                ))}
                                {this.authenticatedPlayer && <Nav.Item>
                                    <Dropdown>
                                        <Dropdown.Toggle id="private-chat-room-dropdown" variant="link">
                                            <img src={chatBubble} width={16} />
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            {this.getOtherPlayers().map(p => (
                                                <Dropdown.Item onClick={() => this.onNewPrivateChatRoomClick(p)} key={p.user.id}>
                                                    {this.getUserDisplayName(p.user)}
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </Nav.Item>}
                            </Nav>
                        </Card.Header>
                        <Card.Body id="game-log-panel" style={{ minHeight: this.gameLogMinHeight, height: this.gameLogHeight }} >
                            <Tab.Content className="h-100">
                                <Tab.Pane eventKey="chat" className="h-100">
                                    <ChatComponent gameClient={this.props.gameClient}
                                        entireGame={this.props.gameState.entireGame}
                                        roomId={this.props.gameState.entireGame.publicChatRoomId}
                                        currentlyViewed={this.currentOpenedTab == "chat"}
                                        injectBetweenMessages={(p, n) => this.injectBetweenMessages(p, n)}
                                        getUserDisplayName={u => this.getUserDisplayName(u)} />
                                </Tab.Pane>
                                <Tab.Pane eventKey="game-logs" className="h-100">
                                    <ScrollToBottom className="h-100" scrollViewClassName="overflow-x-hidden">
                                        <GameLogListComponent ingameGameState={this.props.gameState} />
                                    </ScrollToBottom>
                                </Tab.Pane>
                                <Tab.Pane eventKey="settings">
                                    <GameSettingsComponent gameClient={this.props.gameClient}
                                        entireGame={this.props.gameState.entireGame} />
                                    <UserSettingsComponent user={this.props.gameClient.authenticatedUser}
                                        entireGame={this.props.gameState.entireGame}
                                        parent={this} />
                                </Tab.Pane>
                                {this.authenticatedPlayer && (
                                    <Tab.Pane eventKey="note" className="h-100">
                                        <NoteComponent gameClient={this.props.gameClient} ingame={this.props.gameState} />
                                    </Tab.Pane>
                                )}
                                {this.getPrivateChatRooms().map(({ roomId }) => (
                                    <Tab.Pane eventKey={roomId} key={roomId} className="h-100">
                                        <ChatComponent gameClient={this.props.gameClient}
                                            entireGame={this.props.gameState.entireGame}
                                            roomId={roomId}
                                            currentlyViewed={this.currentOpenedTab == roomId}
                                            getUserDisplayName={u => this.getUserDisplayName(u)} />
                                    </Tab.Pane>
                                ))}
                            </Tab.Content>
                        </Card.Body>
                    </Tab.Container>
                </Card>
            </Col>
        </Row>
    }

    renderDragonStrengthTooltip(): OverlayChildren {
        const roundsWhenIncreased: number[] = [];
        for(let i = this.game.turn + 1; i <= 10; i++) {
            if (i % 2 == 0) {
                roundsWhenIncreased.push(i);
            }
        }
        _.pull(roundsWhenIncreased, this.game.removedDragonStrengthToken);
        return <Tooltip id="dragon-strength-tooltip">
            <div className="m-1 text-center">
                <h6>Current Dragon Strength</h6>
                {roundsWhenIncreased.length > 0 && <p>Will increase in round<br/>{joinNaturalLanguage(roundsWhenIncreased)}</p>}
            </div>
        </Tooltip>
    }

    getColumnOrders(mobileDevice: boolean, alignGameStateToTheRight: boolean): ColumnOrders {
        const result = { gameStateColumn: 1, mapColumn: 2, collapseButtonColumn: 3, housesInfosColumn: 4 };

        if (!mobileDevice && alignGameStateToTheRight) {
            return { collapseButtonColumn: 1, housesInfosColumn: 2, mapColumn: 3, gameStateColumn: 4 };
        }

        return result;
    }

    getUserDisplayName(user: User): React.ReactNode {
        const authenticatedUser = this.props.gameClient.authenticatedUser;
        if (!authenticatedUser || !authenticatedUser.settings.chatHouseNames) {
            return <>{user.name}</>;
        }

        const player = this.props.gameState.players.tryGet(user, null);
        if (player) {
            return <>{player.house.name}</>;
        }

        return <>{user.name}</>;
    }

    get publicChatRoom(): Channel {
        return this.props.gameClient.chatClient.channels.get(this.props.gameState.entireGame.publicChatRoomId);
    }

    private renderRemainingWesterosCards(): OverlayChildren {
        const remainingCards = this.game.remainingWesterosCardTypes.map(deck => _.sortBy(deck.entries, rwct => -rwct[1]));
        const nextCards = this.game.nextWesterosCardTypes;

        return <Tooltip id="remaining-westeros-cards" className="westeros-tooltip">
            {this.gameSettings.cokWesterosPhase && (
                <>
                    <Row className='mt-0'>
                        <Col>
                            <h5 className='text-center'>Next Westeros Cards</h5>
                        </Col>
                    </Row>
                    <Row>
                        {nextCards.map((_, i) =>
                            <Col key={"westeros-deck-" + i + "-header"} className='text-center'><b>Deck {i + 1}</b></Col>)}
                    </Row>
                    <Row>
                        {nextCards.map((wd, i) =>
                            <Col key={"westeros-deck-" + i + "-data"}>
                                {wd.map((wc, j) => wc ? <div key={"westeros-deck-" + i + "-" + j + "-data"}>{wc.name}{wc.shortDescription && (<span>&ensp;<small>({wc.shortDescription})</small></span>)}</div> : <></>)}
                            </Col>)}
                    </Row>
                </>
            )}
            <Row className={this.gameSettings.cokWesterosPhase ? 'mt-4' : 'mt-0'}>
                <Col>
                    <h5 className='text-center'>Remaining Westeros Cards</h5>
                </Col>
            </Row>
            <Row>
                {remainingCards.map((_, i) =>
                    <Col key={"westeros-deck-" + i + "-header"} style={{ textAlign: "center" }}><b>Deck {i + 1}</b></Col>)}
            </Row>
            <Row className="mb-2">
                {remainingCards.map((rc, i) =>
                    <Col key={"westeros-deck-" + i + "-data"}>
                        {rc.map(([wc, count], j) => <div key={"westeros-deck-" + i + "-" + j + "-data"}>{count}x {wc.name}{wc.shortDescription && (<span>&ensp;<small>({wc.shortDescription})</small></span>)}</div>)}
                    </Col>
                )}
            </Row>
        </Tooltip>;
    }

    getConnectedSpectators(): User[] {
        return this.props.gameState.getSpectators().filter(u => u.connected);
    }

    onNewPrivateChatRoomClick(p: Player): void {
        const users = _.sortBy([this.props.gameClient.authenticatedUser as User, p.user], u => u.id);

        if (!this.props.gameState.entireGame.privateChatRoomsIds.has(users[0]) || !this.props.gameState.entireGame.privateChatRoomsIds.get(users[0]).has(users[1])) {
            // Create a new chat room for this player
            this.props.gameState.entireGame.sendMessageToServer({
                type: "create-private-chat-room",
                otherUser: p.user.id
            });
        } else {
            // The room already exists
            // Set the current tab to this user
            this.currentOpenedTab = this.props.gameState.entireGame.privateChatRoomsIds.get(users[0]).get(users[1]);
        }
    }

    getPrivateChatRooms(): {user: User; roomId: string}[] {
        return this.props.gameState.entireGame.getPrivateChatRoomsOf(this.props.gameClient.authenticatedUser as User);
    }

    getPrivateChatRoomForPlayer(u: User): Channel {
        const users = _.sortBy([this.props.gameClient.authenticatedUser as User, u], u => u.id);

        return this.props.gameClient.chatClient.channels.get(this.props.gameState.entireGame.privateChatRoomsIds.get(users[0]).get(users[1]));
    }

    getOtherPlayers(): Player[] {
        return this.props.gameState.players.values.filter(p => p.user != this.props.gameClient.authenticatedUser);
    }

    compileGameLog(gameLog: string): string {
        return marked(gameLog);
    }

    injectBetweenMessages(previous: Message | null, next: Message | null): ReactNode {
        // Take the necessary votes to render, based on the `createdAt` times of
        // `previous` and `next`.
        const votesToRender = this.props.gameState.votes.values.filter(v => (previous != null ? previous.createdAt < v.createdAt : true) && (next ? v.createdAt < next.createdAt : true));
        return _.sortBy(votesToRender, v => v.createdAt).map(v => (
            <VoteComponent key={v.id} vote={v} gameClient={this.props.gameClient} ingame={this.props.gameState} />
        ));
    }

    onWindowResize(): void {
        const mobileDevice = isMobile;
        const scrollbars = this.user?.settings.mapScrollbar ?? false;

        this.windowHeight = (!mobileDevice && scrollbars) ? window.innerHeight : null;

        if (mobileDevice || !scrollbars) {
            this.housesMaxHeight = null;
            return;
        }

        if (!this.housesPanel) {
            this.housesMaxHeight = HOUSES_PANEL_MIN_HEIGHT;
            return;
        }

        let calculatedHousesHeight = Math.trunc(Math.max(window.innerHeight - this.housesPanel.getBoundingClientRect().top - BOTTOM_MARGIN_PX, HOUSES_PANEL_MIN_HEIGHT));

        if (this.gameControlsRow) { // Spectators don't have this row in their DOM
            calculatedHousesHeight -= this.gameControlsRow.offsetHeight + 8; // +8 because of the padding between the both components
        }

        // If actual height is less than calculated height, we dont need to stretch this panel
        this.housesMaxHeight = this.housesPanel.offsetHeight < calculatedHousesHeight ? null : calculatedHousesHeight;
    }

    onGameStatePanelResize(): void {
        const scrollbars = this.user?.settings.mapScrollbar ?? false;
        this.gameLogMinHeight = scrollbars ? GAME_LOG_MIN_HEIGHT : GAME_LOG_MIN_HEIGHT + 140;
        this.gameLogHeight = Math.trunc(window.innerHeight - this.gameLogPanel.getBoundingClientRect().top - BOTTOM_MARGIN_PX);

        const calculatedGameStatePanelHeight = Math.trunc((window.innerHeight - 150) * GAME_STATE_GAME_LOG_RATIO); // -150 because of the space to top and bottom and between the both panels

        this.gameStatePanelMaxHeight = isMobile || !scrollbars || this.gameStatePanel.offsetHeight < calculatedGameStatePanelHeight ? null : calculatedGameStatePanelHeight;
    }

    onNewPrivateChatRoomCreated(roomId: string): void {
        this.currentOpenedTab = roomId;
    }

    componentDidMount(): void {
        this.props.gameState.entireGame.onNewPrivateChatRoomCreated = (roomId: string) => this.onNewPrivateChatRoomCreated(roomId);
        if (!isMobile) {
            window.addEventListener('resize', () => {
                this.onWindowResize();
                this.onGameStatePanelResize();
            });
        }

        this.resizeObserver = new ResizeObserver(() => this.onGameStatePanelResize());
        this.resizeObserver.observe(this.gameStatePanel);

        this.onWindowResize();
    }

    componentWillUnmount(): void {
        this.props.gameState.entireGame.onNewPrivateChatRoomCreated = null;

        if (!isMobile) {
            window.removeEventListener('resize', () => {
                this.onWindowResize();
                this.onGameStatePanelResize();
            });
        }

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
}
