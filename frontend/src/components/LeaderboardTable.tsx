export interface Participant {
  id: string | number;
  name: string;
  badge_count: number;
  arcade_completed: boolean;
  points: number;
  completion: string | number;
}

export interface LeaderboardTableProps {
  participants: Participant[];
}

export function LeaderboardTable({ participants }: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Badges</th>
            <th>Arcade</th>
            <th>Points</th>
            <th>Completion</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((participant, index) => {
            const isFullyCompleted = participant.badge_count >= 19 && participant.arcade_completed;

            return (
              <tr
                key={participant.id}
                className={isFullyCompleted ? 'bg-green-50 border-2 border-green-400 font-semibold' : ''}
              >
                <td>{index + 1}</td>
                <td>
                  {participant.name}
                  {isFullyCompleted && (
                    <span className="ml-2 text-green-600">🎉 ✅</span>
                  )}
                </td>
                <td>
                  <span
                    className={participant.badge_count >= 19 ? 'text-green-600 font-bold' : ''}
                  >
                    {participant.badge_count}
                  </span>
                </td>
                <td>
                  {participant.arcade_completed ? (
                    <span className="text-green-600 font-bold">✓ Yes</span>
                  ) : (
                    <span className="text-gray-400">✗ No</span>
                  )}
                </td>
                <td>{participant.points}</td>
                <td>{participant.completion}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}