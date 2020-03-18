import * as types from '../actions/ActionTypes'

const inintValue = {
  thickness: 1
}

export default function thickness(state = inintValue, action) {
  if (action.type === types.THICKNESS) {
    return {
      thickness: action.thickness
    }
  } 
  return state
}