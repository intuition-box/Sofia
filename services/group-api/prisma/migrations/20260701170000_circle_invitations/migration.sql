-- AlterEnum
-- Owner/member-initiated invitations: the invitee's Application sits in INVITED
-- until they accept (→ ACTIVE membership) or decline.
ALTER TYPE "ApplicationStatus" ADD VALUE 'INVITED';

-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'MEMBER_INVITED';
ALTER TYPE "EventType" ADD VALUE 'INVITE_ACCEPTED';
ALTER TYPE "EventType" ADD VALUE 'INVITE_DECLINED';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'INVITED';
ALTER TYPE "NotificationType" ADD VALUE 'INVITE_ACCEPTED';
