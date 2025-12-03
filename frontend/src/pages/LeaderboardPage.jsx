import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Search, RefreshCw, Calendar, Users, X } from 'lucide-react';
import { format } from 'date-fns';

export default function LeaderboardPage() {
	const [participants, setParticipants] = useState([]);
	const [filteredParticipants, setFilteredParticipants] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [lastUpdated, setLastUpdated] = useState(null);
	const [useTempTable] = useState(true);

	const fetchLeaderboard = async () => {
		try {
			setLoading(true);
			const tableName = useTempTable ? 'temp_participants' : 'participants';
			const { data, error } = await supabase
				.from(tableName)
				.select('*')
				.order('rank', { ascending: true });

			if (error) throw error;
			setParticipants(data || []);
			setFilteredParticipants(data || []);
			setLastUpdated(new Date());
		} catch (err) {
			console.error('Error fetching leaderboard:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLeaderboard();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [useTempTable]);

	useEffect(() => {
		let filtered = [...participants];

		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			filtered = filtered.filter(
				(p) =>
					p.full_name?.toLowerCase().includes(term) ||
					p.email?.toLowerCase().includes(term)
			);
		}

		filtered.sort((a, b) => {
			const rankA = a?.rank ?? Number.MAX_SAFE_INTEGER;
			const rankB = b?.rank ?? Number.MAX_SAFE_INTEGER;
			return rankA - rankB;
		});

		setFilteredParticipants(filtered);
	}, [participants, searchTerm]);

	const getMedal = (rank) => {
		if (rank === 1) return { emoji: '🥇', accent: 'from-yellow-400 to-amber-500' };
		if (rank === 2) return { emoji: '🥈', accent: 'from-gray-200 to-gray-400' };
		if (rank === 3) return { emoji: '🥉', accent: 'from-orange-300 to-amber-500' };
		return { emoji: null, accent: '' };
	};

	// const focusLabels = ['Cloud Engineer track', 'Data & AI track', 'Security track', 'App Modernization track'];
	const avatarGradients = [
		'from-blue-500 to-blue-600',
		'from-red-500 to-orange-500',
		'from-green-500 to-emerald-500',
		'from-purple-500 to-indigo-500'
	];

	const showPodium = !searchTerm && filteredParticipants.length >= 3;

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
					<p className="text-lg text-gray-600">Loading leaderboard...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50">
			<div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
				<header className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Google Cloud Study Jam</p>
							<h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mt-2">
								<span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-100 text-blue-600">
									<Trophy className="w-6 h-6" />
								</span>
								Leaderboard
							</h1>
							<p className="text-gray-600 mt-2">Celebrating {participants.length} active learners</p>
						</div>
						<div className="flex flex-col gap-3 sm:items-end">
							{lastUpdated && (
								<div className="text-sm text-gray-600 flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
									<Calendar className="w-4 h-4 text-blue-600" />
									Updated {format(lastUpdated, 'MMM dd, HH:mm')}
								</div>
							)}
							<button
								onClick={fetchLeaderboard}
								className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-md hover:bg-blue-700 transition-colors"
							>
								<RefreshCw className="w-4 h-4" />
								Refresh data
							</button>
						</div>
					</div>
				</header>

				<section className="bg-white/90 backdrop-blur rounded-2xl border border-gray-100 shadow-sm p-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Explore the cohort</p>
							<p className="text-xl font-bold text-gray-900">
								Showing {filteredParticipants.length} learners
								{participants.length !== filteredParticipants.length && (
									<span className="text-sm font-medium text-gray-500 ml-2">
										(filtered from {participants.length})
									</span>
								)}
							</p>
						</div>
						<div className="relative w-full sm:w-80">
							<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
							<input
								type="text"
								placeholder="Search by name or email"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
							/>
							{searchTerm && (
								<button
									onClick={() => setSearchTerm('')}
									className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
								>
									<X className="w-5 h-5" />
								</button>
							)}
						</div>
					</div>
				</section>

				{showPodium && (
					<section>
						<p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Podium spotlight</p>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
							{[1, 0, 2].map((positionIndex, cardIndex) => {
								const participant = filteredParticipants[positionIndex];
								if (!participant) return null;
								const medal = getMedal(participant.rank);
								const isCenter = cardIndex === 1;

								return (
									<div
										key={participant.id}
										className={`bg-white rounded-2xl border border-gray-100 shadow-lg p-6 text-center transition-transform duration-300 ${
											isCenter ? 'md:-mt-6 ring-2 ring-yellow-100' : ''
										}`}
									>
										<div
											className={`inline-flex items-center justify-center ${isCenter ? 'w-24 h-24' : 'w-20 h-20'} rounded-full bg-gradient-to-br ${medal.accent} border-4 border-white shadow-xl mx-auto mb-4`}
										>
											<span className={isCenter ? 'text-5xl' : 'text-4xl'}>{medal.emoji}</span>
										</div>
										<h3 className={`${isCenter ? 'text-2xl' : 'text-xl'} text-gray-900 mb-1 truncate`}>
											{participant.full_name}
										</h3>
										<p className="text-sm text-gray-600 truncate">{participant.email}</p>
										<div className="mt-4">
											<span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700">
												<span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
												{/* {focusLabels[positionIndex % focusLabels.length]} */}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					</section>
				)}

				<section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
					<div className="flex items-center justify-between flex-wrap gap-4">
						<div>
							<p className="text-xs uppercase tracking-[0.3em] text-gray-500 font-semibold">Participant roster</p>
							<h2 className="text-2xl font-bold text-gray-900 mt-2">All learners</h2>
						</div>
						<span className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
							<Users className="w-4 h-4 text-blue-600" />
							{filteredParticipants.length} total
						</span>
					</div>

					<div className="mt-6 space-y-4">
						{filteredParticipants.length === 0 && (
							<div className="text-center py-10 text-gray-500 border border-dashed border-gray-200 rounded-2xl">
								No participants match your search yet.
							</div>
						)}

						{filteredParticipants.map((participant, index) => {
							const isTopThree = participant.rank <= 3;
							const medal = getMedal(participant.rank);
							const avatarColor = avatarGradients[index % avatarGradients.length];
							// const focusLabel = focusLabels[index % focusLabels.length];

							return (
								<div
									key={participant.id}
									className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-[0_1px_8px_rgba(15,23,42,0.05)] bg-white transition-colors ${
										isTopThree ? 'bg-gradient-to-r from-blue-50 via-white to-green-50' : ''
									}`}
								>
									<div className="flex items-center gap-4">
										{isTopThree && (
											<div className="text-3xl" aria-label={`Rank ${participant.rank}`}>
												{medal.emoji}
											</div>
										)}
										<div
											className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarColor} text-white font-bold text-xl flex items-center justify-center shadow-lg`}
										>
											{participant.full_name?.charAt(0)?.toUpperCase() || '?'}
										</div>
										<div>
											<p className="text-lg font-semibold text-gray-900 leading-tight">{participant.full_name}</p>
											<p className="text-sm text-gray-600">{participant.email}</p>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</section>
			</div>
		</div>
	);
}

