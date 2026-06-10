import { UserRole } from '../models/user.model';

// ─── SyncSpace Permissions Map ────────────────────────────────────────
//
// This is the single source of truth for what each role can access.
// Every route protection decision in every microservice should
// trace back to the rules documented here.
//
// This file does NOT enforce permissions — middleware does that.
// This file DOCUMENTS permissions so the rules are never ambiguous.

export const PERMISSIONS = {

  // ── Auth Service ────────────────────────────────────────────────────
  auth: {
    register:         [UserRole.CANDIDATE, UserRole.INTERVIEWER],  // Anyone can register
    login:            [UserRole.CANDIDATE, UserRole.INTERVIEWER],  // Anyone can login
    logout:           [UserRole.CANDIDATE, UserRole.INTERVIEWER],  // Anyone can logout
    refreshToken:     [UserRole.CANDIDATE, UserRole.INTERVIEWER],  // Anyone can refresh
    viewOwnProfile:   [UserRole.CANDIDATE, UserRole.INTERVIEWER],  // Anyone can view their own profile
  },

  // ── Interview Service (Day 9+) ───────────────────────────────────────
  interviews: {
    create:           [UserRole.INTERVIEWER],                       // Only Interviewers create interviews
    viewAll:          [UserRole.INTERVIEWER],                       // Only Interviewers see all interviews
    viewOwn:          [UserRole.CANDIDATE, UserRole.INTERVIEWER],  // Both can view their own
    delete:           [UserRole.INTERVIEWER],                       // Only Interviewers delete
    submitFeedback:   [UserRole.INTERVIEWER],                       // Only Interviewers give feedback
  },

  // ── Room Service (Day 10+) ───────────────────────────────────────────
  rooms: {
    create:           [UserRole.INTERVIEWER],                       // Only Interviewers create rooms
    join:             [UserRole.CANDIDATE, UserRole.INTERVIEWER],  // Both can join
    end:              [UserRole.INTERVIEWER],                       // Only Interviewers end a room
    viewParticipants: [UserRole.INTERVIEWER],                       // Only Interviewers see all participants
  },

  // ── Scheduling Service (Day 11+) ─────────────────────────────────────
  scheduling: {
    createSlot:       [UserRole.INTERVIEWER],                       // Only Interviewers create time slots
    bookSlot:         [UserRole.CANDIDATE],                         // Only Candidates book slots
    viewAllSlots:     [UserRole.INTERVIEWER],                       // Only Interviewers see all slots
    viewOwnBookings:  [UserRole.CANDIDATE, UserRole.INTERVIEWER],  // Both see their own bookings
    cancelBooking:    [UserRole.CANDIDATE, UserRole.INTERVIEWER],  // Both can cancel their own
  },

} as const;

// ─── Role Descriptions ────────────────────────────────────────────────
// Human-readable summary of what each role means in SyncSpace

export const ROLE_DESCRIPTIONS = {
  [UserRole.CANDIDATE]: 'A job seeker who joins interview rooms, books slots, and submits answers.',
  [UserRole.INTERVIEWER]: 'A hiring professional who creates rooms, schedules interviews, and gives feedback.',
  [UserRole.ADMIN]: 'A platform administrator with full access to all services and user management.',
} as const;