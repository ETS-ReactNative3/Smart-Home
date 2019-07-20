import { AsyncStorage } from "react-native";

AsyncStorage.clear();
export const LoginReducer = (
  state = {
    loggedIn: true,
    token: null,
    skipped: false,
    username: null
  },
  action
) => {
  switch (action.type) {
    case "SKIPPED":
      return {
        ...state,
        skipped: true
      };
    case "LOGIN":
      return {
        ...state,
        token: action.payload.token,
        username: action.payload.username,
        loggedIn: true
      };
    case "LOGOUT":
      return {
        ...state,
        token: null,
        loggedIn: false
      };
    default:
      return state;
  }
};
