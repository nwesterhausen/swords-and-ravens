import {Component, ReactNode} from "react";
import GameClient from "./GameClient";
import IngameGameState from "../common/ingame-game-state/IngameGameState";
import * as React from "react";
import Region from "../common/ingame-game-state/game-data-structure/Region";
import Unit from "../common/ingame-game-state/game-data-structure/Unit";
import PlanningGameState from "../common/ingame-game-state/planning-game-state/PlanningGameState";
import MapControls, {OrderOnMapProperties, RegionOnMapProperties, UnitOnMapProperties} from "./MapControls";
import {observer} from "mobx-react";
import ActionGameState from "../common/ingame-game-state/action-game-state/ActionGameState";
import Order from "../common/ingame-game-state/game-data-structure/Order";
import westerosImage from "../../public/images/westeros.jpg";
import westeros7pImage from "../../public/images/westeros-7p.jpg";
import westerosWithEssosImage from "../../public/images/westeros-with-essos.jpg";
import houseOrderImages from "./houseOrderImages";
import orderImages from "./orderImages";
import unitImages from "./unitImages";
import classNames from "classnames";
import housePowerTokensImages from "./housePowerTokensImages";
import {OverlayTrigger, Tooltip} from "react-bootstrap";
import ConditionalWrap from "./utils/ConditionalWrap";
import BetterMap from "../utils/BetterMap";
import _ from "lodash";
import PartialRecursive from "../utils/PartialRecursive";
import StaticBorder from "../common/ingame-game-state/game-data-structure/static-data-structure/StaticBorder";
import { land } from "../common/ingame-game-state/game-data-structure/regionTypes";
import PlaceOrdersGameState from "../common/ingame-game-state/planning-game-state/place-orders-game-state/PlaceOrdersGameState";
import UseRavenGameState from "../common/ingame-game-state/action-game-state/use-raven-game-state/UseRavenGameState";
import { renderRegionTooltip } from "./regionTooltip";
import getGarrisonToken from "./garrisonTokens";
import { ship } from "../common/ingame-game-state/game-data-structure/unitTypes";
import { OverlayChildren } from "react-bootstrap/esm/Overlay";
import loyaltyTokenImage from "../../public/images/power-tokens/Loyalty.png"

export const MAP_HEIGHT = 1378;
export const MAP_WIDTH = 741;
export const DELUXE_MAT_WIDTH = 1204;
const BLOCKED_REGION_BY_INFINITE_GARRISON = 1000;

interface MapComponentProps {
    gameClient: GameClient;
    ingameGameState: IngameGameState;
    mapControls: MapControls;
}

@observer
export default class MapComponent extends Component<MapComponentProps> {
    backgroundImage: string = westerosImage;
    mapWidth: number = MAP_WIDTH;

    get ingame(): IngameGameState {
        return this.props.ingameGameState;
    }

    constructor(props: MapComponentProps) {
        super(props);

        this.backgroundImage = this.ingame.entireGame.gameSettings.playerCount == 7
        ? westeros7pImage
        : this.ingame.entireGame.gameSettings.playerCount >= 8 ? westerosWithEssosImage
        : westerosImage;

        this.mapWidth = this.ingame.entireGame.gameSettings.playerCount >= 8 ? DELUXE_MAT_WIDTH : MAP_WIDTH;
    }

    render(): ReactNode {
        const garrisons = new BetterMap(this.props.ingameGameState.world.regions
            .values.filter(r => r.garrison > 0 && r.garrison != BLOCKED_REGION_BY_INFINITE_GARRISON)
            .map(r => [r.id, getGarrisonToken(r.id, r.garrison)]));
        return (
            <div className="map"
                 style={{backgroundImage: `url(${this.backgroundImage})`, backgroundSize: "cover", borderRadius: "0.25rem"}}>
                <div style={{position: "relative"}}>
                    {this.props.ingameGameState.world.regions.values.map(r => (
                        <div key={r.id}>
                            {garrisons.tryGet(r.id, null) && (
                                <div
                                    className="garrison-token hover-weak-outline"
                                    style={{
                                        backgroundImage: `url(${garrisons.get(r.id)})`,
                                        left: r.unitSlot.point.x, top: r.unitSlot.point.y
                                    }}
                                >
                                </div>
                            )}
                            {r.loyaltyTokens > 0 && (
                                <div
                                    className={classNames("loyalty-token", {"strong-outline": r.loyaltyTokens > 1})}
                                    style={{
                                        left: r.unitSlot.point.x,
                                        top: r.unitSlot.point.y,
                                        backgroundImage: `url(${loyaltyTokenImage})`,
                                        textAlign: "center",
                                        color: "white"
                                    }}
                                >{r.loyaltyTokens > 1 ? r.loyaltyTokens : ""}
                                </div>
                            )}
                            {r.controlPowerToken && (
                                <div
                                    className="power-token hover-weak-outline"
                                    style={{
                                        left: r.powerTokenSlot.x,
                                        top: r.powerTokenSlot.y,
                                        backgroundImage: `url(${housePowerTokensImages.get(r.controlPowerToken.id)})`
                                    }}
                                >
                                </div>
                            )}
                        </div>
                    ))}
                    {this.renderUnits()}
                    {this.renderOrders()}
                </div>
                <svg style={{width: `${this.mapWidth}px`, height: `${MAP_HEIGHT}px`}}>
                    {this.renderRegions()}
                </svg>
            </div>
        )
    }

    renderRegions(): ReactNode {
        const propertiesForRegions = this.getModifiedPropertiesForEntities<Region, RegionOnMapProperties>(
            this.props.ingameGameState.world.regions.values,
            this.props.mapControls.modifyRegionsOnMap,
            {highlight: {active: false, color: "white"}, onClick: null, wrap: null}
        );

        return propertiesForRegions.entries.map(([region, properties]) => {
            const blocked = region.garrison == BLOCKED_REGION_BY_INFINITE_GARRISON;
            const wrap = properties.wrap;

            return (
                <ConditionalWrap condition={!blocked}
                    key={region.id}
                    wrap={wrap ? wrap : child =>
                        <OverlayTrigger
                            overlay={renderRegionTooltip(region)}
                            delay={{ show: 750, hide: 100 }}
                            placement="auto"
                            rootClose
                        >
                            {child}
                        </OverlayTrigger>
                    }
                >
                    <polygon
                        points={this.getRegionPath(region)}
                        fill={blocked ? "black" : properties.highlight.color}
                        fillRule="evenodd"
                        className={classNames(
                            blocked ? "blocked-region" : "region-area",
                            properties.highlight.active && {
                                "clickable": true,
                                // Whatever the strength of the highlight defined, show the same
                                // highlightness
                                "highlighted-region-area": true,
                                "highlighted-region-area-light": properties.highlight.light,
                                "highlighted-region-area-strong": properties.highlight.strong
                            }
                        )}
                        onClick={properties.onClick != null ? properties.onClick : undefined} />
                </ConditionalWrap>
            );
        });
    }

    renderUnits(): ReactNode {
        const propertiesForUnits = this.getModifiedPropertiesForEntities<Unit, UnitOnMapProperties>(
            _.flatMap(this.props.ingameGameState.world.regions.values.map(r => r.allUnits)),
            this.props.mapControls.modifyUnitsOnMap,
            {highlight: {active: false, color: "white"}, onClick: null}
        );

        return this.props.ingameGameState.world.regions.values.map(r => {
            const controller = r.getController();
            return <div
                key={r.id}
                className="units-container"
                style={{left: r.unitSlot.point.x, top: r.unitSlot.point.y, width: r.unitSlot.width, flexWrap: r.type == land ? "wrap-reverse" : "wrap"}}
            >
                {r.allUnits.map(u => {
                    const property = propertiesForUnits.get(u);

                    let opacity: number;
                    // css transform
                    let transform: string;

                    if (!u.wounded) {
                        opacity = 1;
                        transform = `none`;
                    } else if (u.type == ship) {
                        opacity = 0.5;
                        transform = `none`;
                    } else {
                        opacity = 0.7;
                        transform = `rotate(90deg)`;
                    }

                return <OverlayTrigger
                            key={"unit-overlay-" + u.id}
                            delay={{ show: 750, hide: 100 }}
                            placement="auto"
                            overlay={<Tooltip id={"unit-tooltip-" + u.id}>
                                <b>{u.type.name}</b>{controller != null && <small> of <b>{controller.name}</b></small>}
                            </Tooltip>}
                        >
                            <div onClick={property.onClick ? property.onClick : undefined}
                                className={classNames(
                                    "unit-icon hover-weak-outline",
                                    {
                                        "medium-outline hover-strong-outline": property.highlight.active
                                    },
                                    {
                                        "attacking-army-highlight": property.highlight.color == "red"
                                    },
                                    {
                                        "unit-highlight-yellow": property.highlight.color == "yellow"
                                    },
                                    {
                                        "unit-highlight-green": property.highlight.color == "green"
                                    }
                                )}
                                style={{
                                    backgroundImage: `url(${unitImages.get(u.allegiance.id).get(u.upgradedType ? u.upgradedType.id : u.type.id)})`,
                                    opacity: opacity,
                                    transform: transform
                                }}
                            />
                        </OverlayTrigger>
                })}
            </div>
        });
    }

    renderOrders(): ReactNode {
        const propertiesForOrders = this.getModifiedPropertiesForEntities<Region, OrderOnMapProperties>(
            _.flatMap(this.props.ingameGameState.world.regions.values),
            this.props.mapControls.modifyOrdersOnMap,
            {highlight: {active: false, color: "white"}, onClick: null}
        );

        return propertiesForOrders.map((region, properties) => {

            if (this.props.ingameGameState.childGameState instanceof PlanningGameState && this.props.ingameGameState.childGameState.childGameState instanceof PlaceOrdersGameState) {
                const planningGameState = this.props.ingameGameState.childGameState.childGameState;
                const orderPresent = planningGameState.placedOrders.has(region);
                const order = orderPresent ? planningGameState.placedOrders.get(region) : null;

                if (orderPresent) {
                    const controller = region.getController();

                    if (!controller) {
                        // Should never happen. If there's an order, there's a controller.
                        throw new Error("Should never happen. If there's an order, there's a controller.");
                    }

                    const backgroundUrl = order ? orderImages.get(order.type.id) : houseOrderImages.get(controller.id);

                    return this.renderOrder(region, order, backgroundUrl, properties, false);
                }
            } else if (this.props.ingameGameState.childGameState instanceof ActionGameState) {
                const actionGameState = this.props.ingameGameState.childGameState;

                if (!actionGameState.ordersOnBoard.has(region)) {
                    return;
                }

                const order = actionGameState.ordersOnBoard.get(region);

                return this.renderOrder(region, order, orderImages.get(order.type.id), properties, true);
            }

            return false;
        });
    }

    /**
     * This is used to call modifyRegionOnMap, modifyUnitOnMap and merge the properties
     * of an entity (Region, Unit, ...) that have been modified by `...GameStateComponent` classes.
     * @param entities
     * @param modifyPropertiesFunctions
     * @param defaultProperties
     */
    getModifiedPropertiesForEntities<Entity, Property>(entities: Entity[], modifyPropertiesFunctions: (() => [Entity, PartialRecursive<Property>][])[], defaultProperties: Property): BetterMap<Entity, Property> {
        // Create a Map of properties for all regions that will be shown
        const propertiesForEntities = new BetterMap<Entity, Property>();
        entities.forEach(entity => {
            propertiesForEntities.set(entity, defaultProperties);
        });

        modifyPropertiesFunctions.forEach(modifyPropertiesFunction => {
            const modifiedPropertiesForEntities = modifyPropertiesFunction();

            modifiedPropertiesForEntities.forEach(([entity, modifiedProperties]) => {
                if (propertiesForEntities.has(entity)) {
                    propertiesForEntities.set(entity, _.merge(propertiesForEntities.get(entity), modifiedProperties));
                }
            });
        });

        return propertiesForEntities;
    }

    renderOrder(region: Region, order: Order | null, backgroundUrl: string, properties: OrderOnMapProperties, _isActionGameState: boolean): ReactNode {
        let planningOrAction = (this.ingame.childGameState instanceof PlanningGameState || this.ingame.childGameState instanceof ActionGameState) ? this.ingame.childGameState : null;

        if (planningOrAction instanceof ActionGameState && !(planningOrAction.childGameState instanceof UseRavenGameState)) {
            // Do not show restricted orders after Raven state because Doran may cause a restricted order to be shown which still can be executed
            planningOrAction = null;
        }

        return (
            <div className={classNames(
                    "order-container",
                    {
                        "hover-weak-outline" : order != null,
                        "medium-outline hover-strong-outline clickable": order && properties.highlight.active,
                        "restricted-order": planningOrAction && order && this.ingame.game.isOrderRestricted(region, order, planningOrAction.planningRestrictions)
                    }
                )}
                 style={{left: region.orderSlot.x, top: region.orderSlot.y}}
                 onClick={properties.onClick ? properties.onClick : undefined}
                 key={"region-" + region.id}
            >
                <OverlayTrigger overlay={this.renderOrderTooltip(order, region)}
                    delay={{show: 750, hide: 100}}>
                    <div className="order-icon" style={{backgroundImage: `url(${backgroundUrl})`}}/>
                </OverlayTrigger>
            </div>
        );
    }

    private renderOrderTooltip(order: Order | null, region: Region): OverlayChildren {
        return <Tooltip id={"order-info"}>
            <b>{order ? order.type.name : "Order token"}</b><small> of <b>{region.getController()?.name ?? "Unknown"}</b><br/><b>{region.name}</b></small>
        </Tooltip>;
    }

    getBorderPathD(border: StaticBorder): string {
        return border.polygon.map(p => p.x + "," + p.y).join(" ");
    }

    getColorUnitSlot(r: Region): string {
        const controller = r.getController();

        return controller ? controller.color : "";
    }

    getRegionPath(region: Region): string {
        const points = this.props.ingameGameState.world.getContinuousBorder(region);

        return points.map(p => p.x + "," + p.y).join(" ");
    }
}
