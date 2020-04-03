import * as types from '../actions/ActionTypes'

const inintValue = {
  color: "rgba(0,0,0,1)"
}

export default function color(state = inintValue, action) {
  if (action.type === types.COLOR) {
    return {
      color: action.color
    }
  } 
  return state
}