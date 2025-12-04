import { Link } from 'react-router-dom';
import { Trophy, Award, Users, BookOpen, Cloud, TrendingUp, Clock, Target, CheckCircle, ArrowRight, Calendar, GraduationCap, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function HomePage() {
  const [stats, setStats] = useState({
    totalParticipants: 0,
    totalBadges: 0,
    activeNow: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: participants, error } = await supabase
        .from('participants')
        .select('total_badges');
      
      if (error) throw error;
      
      const totalBadges = participants.reduce((sum, p) => sum + (p.total_badges || 0), 0);
      const activeParticipants = participants.filter(p => p.total_badges > 0).length;
      
      setStats({
        totalParticipants: participants.length,
        totalBadges,
        activeNow: activeParticipants
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-50 via-white to-green-50 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-google-blue rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-google-green rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-google-blue/10 border border-google-blue/20 rounded-full">
                <Sparkles className="w-4 h-4 text-google-blue" />
                <span className="text-sm font-medium text-google-blue">Cloud Study Jam 2025</span>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                  Master Google Cloud
                  <span className="block mt-2">
                    <span className="text-google-blue">Build</span>{' '}
                    <span className="text-google-red">Your</span>{' '}
                    <span className="text-google-yellow">Future</span>
                  </span>
                </h1>
                <p className="text-xl text-gray-600 max-w-xl">
                  Join GDG on Campus APSIT's official Cloud Study Jam. Learn cloud computing, earn skill badges, and compete with peers.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/leaderboard"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-google-blue text-white font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg"
                >
                  <Trophy className="w-5 h-5" />
                  View Leaderboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/announcements"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border-2 border-gray-200 hover:border-google-blue hover:text-google-blue transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  Latest Updates
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{stats.totalParticipants}+</div>
                  <div className="text-sm text-gray-600">Participants</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">{stats.totalBadges}+</div>
                  <div className="text-sm text-gray-600">Badges Earned</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-google-green">{stats.activeNow}+</div>
                  <div className="text-sm text-gray-600">Active Learners</div>
                </div>
              </div>
            </div>

            {/* Right Content - Visual */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-google-blue/10 to-google-green/10 rounded-3xl p-8 border border-gray-200">
                {/* Cloud Icon */}
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-google-blue rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                  <Cloud className="w-10 h-10 text-white" />
                </div>
                
                {/* Stats Cards */}
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-google-blue/10 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-google-blue" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">15+</div>
                        <div className="text-sm text-gray-600">Learning Tracks</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-google-green/10 rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-google-green" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">50+</div>
                        <div className="text-sm text-gray-600">Skill Badges</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-google-yellow/10 rounded-lg flex items-center justify-center">
                        <Target className="w-6 h-6 text-google-yellow" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">100%</div>
                        <div className="text-sm text-gray-600">Hands-on Labs</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Join Study Jam?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to master Google Cloud Platform and boost your career
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-google-blue hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-google-blue/10 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-google-blue" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hands-on Learning</h3>
            <p className="text-gray-600">Practical labs with real Google Cloud services and tools</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-google-green hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-google-green/10 rounded-lg flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-google-green" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Earn Badges</h3>
            <p className="text-gray-600">Collect skill badges recognized by industry leaders</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-google-red hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-google-red/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-google-red" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Community Support</h3>
            <p className="text-gray-600">Learn together with mentors and peers from GDG APSIT</p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-google-yellow hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-google-yellow/10 rounded-lg flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-google-yellow" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Compete & Win</h3>
            <p className="text-gray-600">Climb the leaderboard and win exciting prizes</p>
          </div>
        </div>
      </div>

      {/* Learning Path Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Learning Journey
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A structured path to cloud mastery in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-google-blue transition-colors">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-google-blue text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                1
              </div>
              <CheckCircle className="w-12 h-12 text-google-blue mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Enroll & Start</h3>
              <p className="text-gray-600">
                Sign up for Cloud Skills Boost and join the Study Jam program with your APSIT email
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-google-green transition-colors">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-google-green text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                2
              </div>
              <BookOpen className="w-12 h-12 text-google-green mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Complete Labs</h3>
              <p className="text-gray-600">
                Work through hands-on labs and quests to build practical cloud computing skills
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-google-yellow transition-colors">
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-google-yellow text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                3
              </div>
              <Trophy className="w-12 h-12 text-google-yellow mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Earn & Compete</h3>
              <p className="text-gray-600">
                Collect skill badges and climb the leaderboard to win prizes and recognition
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-google-blue to-google-green rounded-3xl p-12 text-center text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <TrendingUp className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your Cloud Journey?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join {stats.totalParticipants}+ students already learning and earning badges. Don't miss out!
            </p>
            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-google-blue font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-xl"
            >
              <Trophy className="w-5 h-5" />
              Check Your Rank
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Clock className="w-5 h-5 text-google-blue" />
                <h3 className="font-bold text-gray-900">Program Duration</h3>
              </div>
              <p className="text-gray-600">Ongoing throughout the semester</p>
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Target className="w-5 h-5 text-google-green" />
                <h3 className="font-bold text-gray-900">Learning Format</h3>
              </div>
              <p className="text-gray-600">Self-paced online labs & quests</p>
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Award className="w-5 h-5 text-google-red" />
                <h3 className="font-bold text-gray-900">Certification</h3>
              </div>
              <p className="text-gray-600">Google Cloud skill badges</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
