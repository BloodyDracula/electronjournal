import { createStore } from 'vuex'
import auth from './modules/auth'
import users from './modules/users'
import groups from './modules/groups'
import subjects from './modules/subjects'
import grades from './modules/grades'

export default createStore({
  modules: {
    auth,
    users,
    groups,
    subjects,
    grades
  }
})