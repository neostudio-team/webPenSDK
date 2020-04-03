import * as types from '../actions/ActionTypes'

const inintValue = {
  open: true
}

export default function drawer(state = inintValue, action) {
  if (action.type === types.DRAWER) {
    return {
      open: action.open
    }
  } 
  return state
}