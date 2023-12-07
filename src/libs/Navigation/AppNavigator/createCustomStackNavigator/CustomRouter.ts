import {NavigationState, PartialState, RouterConfigOptions, StackNavigationState, StackRouter} from '@react-navigation/native';
import {ParamListBase} from '@react-navigation/routers';
import getIsSmallScreenWidth from '@libs/getIsSmallScreenWidth';
import NAVIGATORS from '@src/NAVIGATORS';
import SCREENS from '@src/SCREENS';
import type {ResponsiveStackNavigatorRouterOptions} from './types';

type State = NavigationState | PartialState<NavigationState>;

const isAtLeastOneInState = (state: State, screenName: string): boolean => !!state.routes.find((route) => route.name === screenName);

const getTopMostReportIDFromRHP = (state: State): string => {
    if (!state) {
        return '';
    }

    const topmostRightPane = state.routes.filter((route) => route.name === NAVIGATORS.RIGHT_MODAL_NAVIGATOR).at(-1);

    if (topmostRightPane?.state) {
        return getTopMostReportIDFromRHP(topmostRightPane.state);
    }

    const topmostRoute = state.routes.at(-1);

    if (topmostRoute?.state) {
        return getTopMostReportIDFromRHP(topmostRoute.state);
    }

    if (topmostRoute?.params && 'reportID' in topmostRoute.params && typeof topmostRoute.params.reportID === 'string' && topmostRoute.params.reportID) {
        return topmostRoute.params.reportID;
    }

    return '';
};
/**
 * Adds report route without any specific reportID to the state.
 * The report screen will self set proper reportID param based on the helper function findLastAccessedReport (look at ReportScreenWrapper for more info)
 *
 * @param state - react-navigation state
 */
const addCentralPaneNavigatorRoute = (state: State) => {
    const reportID = getTopMostReportIDFromRHP(state);
    const centralPaneNavigatorRoute = {
        name: NAVIGATORS.CENTRAL_PANE_NAVIGATOR,
        state: {
            routes: [
                {
                    name: SCREENS.REPORT,
                    params: {
                        reportID,
                    },
                },
            ],
        },
    };
    state.routes.splice(1, 0, centralPaneNavigatorRoute);
    // eslint-disable-next-line no-param-reassign, @typescript-eslint/non-nullable-type-assertion-style
    (state.index as number) = state.routes.length - 1;
};

const mapScreenNameToSettingsScreenName: Record<string, string> = {
    [SCREENS.SETTINGS.DISPLAY_NAME]: SCREENS.SETTINGS.PROFILE,
    [SCREENS.SETTINGS.CONTACT_METHODS]: SCREENS.SETTINGS.PROFILE,
    [SCREENS.SETTINGS.CONTACT_METHOD_DETAILS]: SCREENS.SETTINGS.PROFILE,
    [SCREENS.SETTINGS.SECURITY]: SCREENS.SETTINGS.SECURITY,
    [SCREENS.SETTINGS.PREFERENCES_LANGUAGE]: SCREENS.SETTINGS.PREFERENCES,
    [SCREENS.SETTINGS.PREFERENCES_THEME]: SCREENS.SETTINGS.PREFERENCES,
    [SCREENS.SETTINGS.PREFERENCES_PRIORITY_MODE]: SCREENS.SETTINGS.PREFERENCES,
};

const handleSettingsOpened = (state: State) => {
    const rhpNav = state.routes.find((route) => route.name === NAVIGATORS.RIGHT_MODAL_NAVIGATOR);
    if (!rhpNav?.state?.routes[0]) {
        return;
    }
    const screen = rhpNav.state.routes[0];
    // check if we are on settings screen
    if (screen.name !== 'Settings') {
        return;
    }
    // check if we already have settings home route
    if (isAtLeastOneInState(state, NAVIGATORS.FULL_SCREEN_NAVIGATOR)) {
        return;
    }

    const settingsScreenName = screen?.state?.routes[0].name;

    if (!settingsScreenName) {
        return;
    }

    const settingsHomeRouteName = mapScreenNameToSettingsScreenName[settingsScreenName] || SCREENS.SETTINGS.PROFILE;

    const fullScreenRoute = {
        name: NAVIGATORS.FULL_SCREEN_NAVIGATOR,
        state: {
            routes: [
                {
                    name: SCREENS.SETTINGS_HOME,
                },
                {
                    name: SCREENS.SETTINGS_CENTRAL_PANE,
                    state: {
                        routes: [
                            {
                                name: settingsHomeRouteName,
                            },
                        ],
                    },
                },
            ],
        },
    };
    state.routes.splice(2, 0, fullScreenRoute);
    // eslint-disable-next-line no-param-reassign, @typescript-eslint/non-nullable-type-assertion-style
    (state.index as number) = state.routes.length - 1;
    // eslint-disable-next-line no-param-reassign, @typescript-eslint/non-nullable-type-assertion-style
    (state.stale as boolean) = true;
};

function CustomRouter(options: ResponsiveStackNavigatorRouterOptions) {
    const stackRouter = StackRouter(options);

    return {
        ...stackRouter,
        getRehydratedState(partialState: StackNavigationState<ParamListBase>, {routeNames, routeParamList, routeGetIdList}: RouterConfigOptions): StackNavigationState<ParamListBase> {
            const isSmallScreenWidth = getIsSmallScreenWidth();
            // Make sure that there is at least one CentralPaneNavigator (ReportScreen by default) in the state if this is a wide layout
            if (!isAtLeastOneInState(partialState, NAVIGATORS.CENTRAL_PANE_NAVIGATOR) && !isSmallScreenWidth) {
                // If we added a route we need to make sure that the state.stale is true to generate new key for this route

                // eslint-disable-next-line no-param-reassign
                (partialState.stale as boolean) = true;
                addCentralPaneNavigatorRoute(partialState);
            }
            handleSettingsOpened(partialState);
            const state = stackRouter.getRehydratedState(partialState, {routeNames, routeParamList, routeGetIdList});
            return state;
        },
    };
}

export default CustomRouter;
