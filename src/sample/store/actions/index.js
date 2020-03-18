import * as types from "./ActionTypes"

export function drawer(open) {
  return {
    type: types.DRAWER,
    open
  }
}

export function color(color){
  return {
    type: types.COLOR,
    color
  }
}

export function thickness(thickness){
  return {
    type: types.THICKNESS,
    thickness
  }
}