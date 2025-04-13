import { createStore } from 'vuex'
import auth from './modules/auth'
import users from './modules/users'
import groups from './modules/groups'
import subjects from './modules/subjects'
import grades from './modules/grades'
import assignments from './modules/assignments'
import lessons from './modules/lessons'
import attendance from './modules/attendance'

export default createStore({
  modules: {
    auth,
    users,
    groups,
    subjects,
    grades,
    assignments,
    lessons,
    attendance
  }
})