import {observer} from "mobx-react";
import {Component} from "react";
import WesterosGameState from "../../common/ingame-game-state/westeros-game-state/WesterosGameState";
import WildlingAttackGameState
    from "../../common/ingame-game-state/westeros-game-state/wildling-attack-game-state/WildlingAttackGameState";
import * as React from "react";
import WildlingAttackComponent from "./wildling-attack-component/WildlingAttackComponent";
import ReconcileArmiesGameState
    from "../../common/ingame-game-state/westeros-game-state/reconcile-armies-game-state/ReconcileArmiesGameState";
import ReconcileArmiesComponent from "./ReconcileArmiesComponent";
import ClashOfKingsGameState
    from "../../common/ingame-game-state/westeros-game-state/clash-of-kings-game-state/ClashOfKingsGameState";
import ClashOfKingsComponent from "./ClashOfKingsComponent";
import MusteringGameState
    from "../../common/ingame-game-state/westeros-game-state/mustering-game-state/MusteringGameState";
import MusteringComponent from "./MusteringComponent";
import ListGroupItem from "react-bootstrap/ListGroupItem";
import PutToTheSwordGameState
    from "../../common/ingame-game-state/westeros-game-state/put-to-the-swords-game-state/PutToTheSwordGameState";
import SimpleChoiceComponent from "./SimpleChoiceComponent";
import DarkWingsDarkWordsGameState
    from "../../common/ingame-game-state/westeros-game-state/dark-wings-dark-words-game-state/DarkWingsDarkWordsGameState";
import AThroneOfBladesGameState
    from "../../common/ingame-game-state/westeros-game-state/thrones-of-blades-game-state/AThroneOfBladesGameState";
import GameStateComponentProps from "./GameStateComponentProps";
import renderChildGameState from "../utils/renderChildGameState";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import WesterosCardComponent from "./utils/WesterosCardComponent";

@observer
export default class WesterosGameStateComponent extends Component<GameStateComponentProps<WesterosGameState>> {
    render() {
        return (
            <>
                {this.props.gameState.currentCard && (
                    <ListGroupItem>
                        <Row className="justify-content-center">
                            <Col xs="auto">
                                <WesterosCardComponent cardType={this.props.gameState.currentCard.type}/>
                            </Col>
                        </Row>
                    </ListGroupItem>
                )}
                {this.props.gameState.childGameState instanceof PutToTheSwordGameState ? (
                    <SimpleChoiceComponent gameClient={this.props.gameClient}
                                           gameState={this.props.gameState.childGameState.childGameState}
                                           mapControls={this.props.mapControls}/>
                ) : this.props.gameState.childGameState instanceof DarkWingsDarkWordsGameState ? (
                    <SimpleChoiceComponent gameClient={this.props.gameClient}
                                           gameState={this.props.gameState.childGameState.childGameState}
                                           mapControls={this.props.mapControls}/>
                ) : this.props.gameState.childGameState instanceof AThroneOfBladesGameState ? (
                    <SimpleChoiceComponent gameClient={this.props.gameClient}
                                           gameState={this.props.gameState.childGameState.childGameState}
                                           mapControls={this.props.mapControls}/>
                ) : renderChildGameState(this.props, [
                    [WildlingAttackGameState, WildlingAttackComponent],
                    [ReconcileArmiesGameState, ReconcileArmiesComponent],
                    [ClashOfKingsGameState, ClashOfKingsComponent],
                    [MusteringGameState, MusteringComponent]
                ])}
            </>
        );
    }
}
