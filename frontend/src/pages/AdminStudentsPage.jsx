import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { AlertCircle, RefreshCw, Search, Users } from 'lucide-react';

export default function AdminStudentsPage() {
	const [participants, setParticipants] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchParticipants();
	}, []);

	const fetchParticipants = async () => {
		try {
			setLoading(true);
			setError(null);
			const { data, error } = await supabase
				.from('temp_participants')
				.select('*')
				.order('total_badges', { ascending: false });

			if (error) throw error;
			setParticipants(data || []);
		} catch (err) {
			console.error('Error loading temp_participants', err);
			setError('Unable to load participants. Please verify the temp_participants table or RLS rules.');
		} finally {
			setLoading(false);
		}
	};

	const filteredParticipants = useMemo(() => {
		if (!searchTerm) return participants;
		const term = searchTerm.toLowerCase();
		return participants.filter((participant) =>
			participant.full_name?.toLowerCase().includes(term) || participant.email?.toLowerCase().includes(term)
		);
	}, [participants, searchTerm]);

	const summary = useMemo(() => {
		if (!participants.length) return { totalBadges: 0, arcadeFinishers: 0 };
		const totalBadges = participants.reduce((sum, participant) => sum + (participant.total_badges || 0), 0);
		const arcadeFinishers = participants.filter((participant) => (participant.arcade_completed || 0) > 0).length;
		return { totalBadges, arcadeFinishers };
	}, [participants]);

	return (
		<div className="min-h-screen bg-slate-50 py-10">
			<div className="max-w-6xl mx-auto px-4 space-y-8">
				<header className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">Admin Console</p>
							<h1 className="text-3xl font-bold text-gray-900 mt-2">Learner roster</h1>
							<p className="text-sm text-gray-600">
								This view mirrors the Supabase <code className="px-1 bg-slate-100 rounded">temp_participants</code> table that powers the leaderboard.
							</p>
						</div>
						<button
							onClick={fetchParticipants}
							className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700"
						>
							<RefreshCw className="w-4 h-4" />
							Refresh
						</button>
					</div>
				</header>

				{error && (
					<div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl px-4 py-3 flex items-center gap-2">
						<AlertCircle className="w-4 h-4" />
						<span>{error}</span>
					</div>
				)}

				<section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
						<p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">Learners</p>
						<p className="text-3xl font-bold text-gray-900 mt-2">{participants.length}</p>
						<p className="text-sm text-gray-500 mt-1">Synced from temp_participants</p>
					</div>
					<div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
						<p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">Total badges</p>
						<p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalBadges}</p>
						<p className="text-sm text-gray-500 mt-1">Summed across all learners</p>
					</div>
					<div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
						<p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">Arcade finishers</p>
						<p className="text-3xl font-bold text-gray-900 mt-2">{summary.arcadeFinishers}</p>
						<p className="text-sm text-gray-500 mt-1">Participants with ≥1 completion</p>
					</div>
				</section>

				<section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">Student roster</p>
							<h2 className="text-2xl font-bold text-gray-900 mt-2 flex items-center gap-2">
								<Users className="w-5 h-5 text-blue-600" />
								{filteredParticipants.length} shown
							</h2>
						</div>
						<div className="relative w-full sm:w-80">
							<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
							<input
								type="text"
								value={searchTerm}
								placeholder="Search by name or email"
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500"
							/>
						</div>
					</div>

					<div className="mt-6 border border-gray-100 rounded-2xl overflow-hidden">
						<div className="hidden sm:grid grid-cols-12 bg-gray-50 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
							<span className="col-span-4">Name & email</span>
							<span className="col-span-3">Total badges</span>
							<span className="col-span-3">Arcade completed</span>
							<span className="col-span-2">Last earned</span>
						</div>

						{loading ? (
							<div className="p-6 text-center text-gray-500">Loading participants...</div>
						) : filteredParticipants.length === 0 ? (
							<div className="p-6 text-center text-gray-500">No participants match your search.</div>
						) : (
							<ul className="divide-y divide-gray-100">
								{filteredParticipants.map((participant) => (
									<li key={participant.id || participant.email} className="grid grid-cols-1 sm:grid-cols-12 gap-3 px-4 sm:px-6 py-4">
										<div className="col-span-4">
											<p className="font-semibold text-gray-900">{participant.full_name || 'Unnamed learner'}</p>
											<p className="text-sm text-gray-500">{participant.email}</p>
										</div>
										<div className="col-span-3">
											<p className="text-gray-900 font-medium">{participant.total_badges ?? '—'}</p>
											<p className="text-xs text-gray-500">Rank #{participant.rank ?? '—'}</p>
										</div>
										<div className="col-span-3">
											<p className="text-gray-900 font-medium">{participant.arcade_completed ?? 0}</p>
											<p className="text-xs text-gray-500">Arcade completions</p>
										</div>
									<div className="col-span-2">
										<p className="text-sm text-gray-600">
											{participant.last_earned ? format(new Date(participant.last_earned), 'MMM dd, yyyy') : '—'}
										</p>
									</div>
									</li>
								))}
							</ul>
						)}
					</div>
				</section>
			</div>
		</div>
	);
}
