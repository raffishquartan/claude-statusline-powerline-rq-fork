export { BaseSegment, SegmentBuilder, SegmentData } from './base';
export { ContextSegment } from './context';
export { DirectorySegment } from './directory';
export { GitSegment } from './git';
export { ModelSegment } from './model';
export { SessionSegment } from './session';
export { RateLimitsSegment } from './rate-limits';
export { SessionIdSegment } from './session-id';
export { UsageSegment } from './usage';
export { WindowSegment } from './window';
export { LastMessageTimeSegment } from './last-message-time';
export { RateLimitResetSegment } from './rate-limit-reset';

// Auto-register all segments
import { segmentRegistry } from '../core/registry';
import { ContextSegment } from './context';
import { DirectorySegment } from './directory';
import { GitSegment } from './git';
import { ModelSegment } from './model';
import { SessionSegment } from './session';
import { RateLimitsSegment } from './rate-limits';
import { SessionIdSegment } from './session-id';
import { UsageSegment } from './usage';
import { WindowSegment } from './window';
import { LastMessageTimeSegment } from './last-message-time';
import { RateLimitResetSegment } from './rate-limit-reset';

// Register default segments
segmentRegistry.register(new ModelSegment());
segmentRegistry.register(new DirectorySegment());
segmentRegistry.register(new GitSegment());
segmentRegistry.register(new SessionSegment());
segmentRegistry.register(new ContextSegment());
segmentRegistry.register(new RateLimitsSegment());
segmentRegistry.register(new SessionIdSegment());
segmentRegistry.register(new UsageSegment());
segmentRegistry.register(new WindowSegment());
segmentRegistry.register(new LastMessageTimeSegment());
segmentRegistry.register(new RateLimitResetSegment());
