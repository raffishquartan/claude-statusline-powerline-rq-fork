import { SessionSegment } from '../../segments/session';
import { ClaudeStatusInput } from '../../types';
import { get_usage_db } from '../../utils/usage-db';

function run_session_segment_tests(): boolean {
	console.log('🧪 Running SessionSegment tests...\n');

	const session_segment = new SessionSegment();

	// Test 1: Database integration with mock session
	console.log('Test 1: Database integration with mock session');

	try {
		// Create a test session in the database
		const db = get_usage_db();
		const test_session_id = 'test-db-session-' + Date.now();

		db.record_session({
			session_id: test_session_id,
			model: 'claude-3-5-sonnet-20241022',
			start_time: new Date().toISOString(),
			end_time: new Date(Date.now() + 60000).toISOString(), // 1 minute later
			input_tokens: 1000,
			output_tokens: 500,
			cache_tokens: 200,
			cost: 0.05,
			project_dir: '/test/project',
		});

		// Test data that should trigger database lookup
		const test_data: ClaudeStatusInput = {
			session_id: test_session_id,
			model: { display_name: 'Sonnet 3.5' },
			workspace: { current_dir: '/test/project' },
		};

		const config = {
			separators: {
				model: 'thick' as any,
				directory: 'thick' as any,
				git: {
					clean: 'thick' as any,
					dirty: 'thick' as any,
					ahead: 'thick' as any,
					behind: 'thick' as any,
					conflicts: 'thick' as any,
					staged: 'thick' as any,
					untracked: 'thick' as any,
				},
				session: 'thick' as any,
				context: 'thick' as any,
			},
			current_theme: {
				segments: {
					session: {
						background: '\x1b[48;2;124;58;237m',
						foreground: '\x1b[38;2;255;255;255m',
						separator_color: '\x1b[38;2;124;58;237m',
					},
				},
			},
		};

		const result = session_segment.build(test_data, config);

		if (!result) {
			console.log(
				'❌ FAIL: Should return segment data for database session',
			);
			return false;
		}

		if (!result.content.includes('$0.05')) {
			console.log('❌ FAIL: Should show correct cost from database');
			console.log('Result content:', result.content);
			return false;
		}

		console.log('✅ PASS: Database session lookup works correctly');

		// Test 2: No segment when session not in database
		console.log('\nTest 2: No segment when session not in database');

		const missing_data: ClaudeStatusInput = {
			session_id: 'non-existent-session-' + Date.now(),
			model: { display_name: 'Sonnet 3.5' },
			workspace: { current_dir: '/test/project' },
		};

		const missing_result = session_segment.build(
			missing_data,
			config,
		);

		// Should show "nodata" since session not in database
		if (missing_result === null) {
			console.log(
				'❌ FAIL: Should return "nodata" segment when session not in database',
			);
			return false;
		}

		if (!missing_result.content.includes('nodata')) {
			console.log(
				'❌ FAIL: Missing session should show "nodata"',
			);
			console.log('Result content:', missing_result.content);
			return false;
		}

		console.log('✅ PASS: Missing session shows "nodata"');

		// Test 3: Database error handling
		console.log('\nTest 3: Database error handling');

		// Close database to simulate error
		db.close();

		const error_data: ClaudeStatusInput = {
			session_id: 'error-test-session',
			model: { display_name: 'Sonnet 3.5' },
			workspace: { current_dir: '/test/project' },
		};

		const error_result = session_segment.build(error_data, config);

		// Should show "nodata" on database error
		if (
			error_result === null ||
			!error_result.content.includes('nodata')
		) {
			console.log(
				'❌ FAIL: Should handle database errors gracefully with "nodata"',
			);
			return false;
		}

		console.log('✅ PASS: Database error handling works correctly');
	} catch (error) {
		console.log('❌ FAIL: Test threw unexpected error:', error);
		return false;
	}

	console.log('\n✅ All SessionSegment tests passed!\n');
	return true;
}

if (require.main === module) {
	const success = run_session_segment_tests();
	process.exit(success ? 0 : 1);
}

export { run_session_segment_tests };
