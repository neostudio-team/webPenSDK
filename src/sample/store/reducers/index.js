import {combineReducers} from 'redux'
import drawer from './drawer'
import color from './color'
import thickness from './thickness'

const reducer = combineReducers({drawer, color, thickness})

export default reducer