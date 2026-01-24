/**
 * Index de factories para facilitar importações
 */

// Tenant Factory
export {
  makeTenant,
  insertTenant,
  type TenantData,
  type TenantRecord
} from './tenant.factory'

// User Factory
export {
  makeUser,
  insertUser,
  insertUserWithTenant,
  type UserData,
  type UserRecord
} from './user.factory'

// Profile Factory
export {
  makeProfile,
  insertProfile,
  linkProfileToRoute,
  linkUserToProfile,
  type ProfileData,
  type ProfileRecord
} from './profile.factory'

// Route Factory
export {
  makeRoute,
  insertRoute,
  type RouteData,
  type RouteRecord
} from './route.factory'

// Invite Factory
export {
  makeInvite,
  insertInvite,
  acceptInvite,
  type InviteData,
  type InviteRecord
} from './invite.factory'
