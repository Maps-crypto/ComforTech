import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_PEER_POSTS, STRESSORS } from '../data/mockData';
import { PeerPost, StressorCategory, UserProfile } from '../types';
import {
  Users,
  Heart,
  MessageSquare,
  Send,
  Plus,
  Shield,
  ShieldCheck,
  UserCheck,
  User,
  Filter,
  Building,
  ChevronDown,
  ChevronUp,
  Sparkles,
  EyeOff,
  Eye,
  CheckCircle2,
} from 'lucide-react';

interface PeerCommunityProps {
  userProfile: UserProfile;
  onActivityLogged: (title: string, desc: string, score?: number) => void;
}

export const PeerCommunity: React.FC<PeerCommunityProps> = ({
  userProfile,
  onActivityLogged,
}) => {
  const [posts, setPosts] = useState<PeerPost[]>(INITIAL_PEER_POSTS);
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  
  // Post Creation States
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState<StressorCategory>('Exams & Deadlines');
  const [isAnonymousPost, setIsAnonymousPost] = useState(true);
  const [customAnonAlias, setCustomAnonAlias] = useState('');

  // Reply States
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isAnonymousReply, setIsAnonymousReply] = useState(true);

  const filteredPosts = selectedTag === 'All'
    ? posts
    : posts.filter((p) => p.tag === selectedTag);

  const getEffectiveAuthorName = (isAnon: boolean, customAlias?: string) => {
    if (isAnon) {
      if (customAlias && customAlias.trim()) {
        return customAlias.trim().startsWith('Anon_') ? customAlias.trim() : `Anon_${customAlias.trim()}`;
      }
      const uniShort = userProfile.university
        ? userProfile.university.split(' ')[0]
        : 'Student';
      return `Anon_${uniShort}_Peer`;
    }
    return userProfile.displayName || 'Student Member';
  };

  const handleCheer = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, cheers: p.cheers + 1 } : p))
    );
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const authorName = getEffectiveAuthorName(isAnonymousPost, customAnonAlias);
    const avatarColor = isAnonymousPost ? '#059669' : '#2563eb';

    const newPost: PeerPost = {
      id: 'p_' + Date.now(),
      authorAlias: authorName,
      isAnonymous: isAnonymousPost,
      avatarColor: avatarColor,
      tag: newTag,
      title: newTitle.trim(),
      content: newContent.trim(),
      timestamp: 'Just now',
      university: userProfile.university || 'South African University',
      cheers: 1,
      repliesCount: 0,
      replies: [],
    };

    setPosts([newPost, ...posts]);
    setNewTitle('');
    setNewContent('');
    setCustomAnonAlias('');
    setIsCreatingPost(false);

    const logTitle = isAnonymousPost ? 'Anonymous Circle Post' : 'Named Circle Post';
    onActivityLogged(
      logTitle,
      `Shared thoughts on "${newTag}" (${isAnonymousPost ? 'Anonymous' : 'Public as ' + authorName})`,
      65
    );
  };

  const handleAddReply = (postId: string) => {
    if (!replyText.trim()) return;

    const replyAuthor = isAnonymousReply
      ? 'Anon_Peer'
      : userProfile.displayName || 'Student Member';

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newReply = {
            id: 'r_' + Date.now(),
            authorAlias: replyAuthor,
            content: replyText.trim(),
            timestamp: 'Just now',
            isAnonymous: isAnonymousReply,
          };
          return {
            ...p,
            repliesCount: p.repliesCount + 1,
            replies: [...(p.replies || []), newReply],
          };
        }
        return p;
      })
    );

    setReplyText('');
    onActivityLogged(
      'Encouraged a Peer',
      `Replied to post (${isAnonymousReply ? 'Anonymously' : 'as ' + replyAuthor})`,
      70
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Student Support Circles
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
            A safe, moderated peer space to share lived university experiences, ask for advice, or lend encouragement. Choose to post <strong className="text-slate-800">100% anonymously</strong> or with your <strong className="text-slate-800">profile name</strong> anytime.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreatingPost(true)}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Create Post</span>
        </motion.button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Topic:
        </span>
        <button
          onClick={() => setSelectedTag('All')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
            selectedTag === 'All'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Topics
        </button>
        {STRESSORS.map((st) => (
          <button
            key={st}
            onClick={() => setSelectedTag(st)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              selectedTag === st
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* New Post Form Modal / Expandable Card */}
      <AnimatePresence>
        {isCreatingPost && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-600 shadow-lg space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Create a Circle Post
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choose your privacy mode before sharing with peers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingPost(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Privacy Mode Selector: Anonymous vs Named */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Privacy Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Anonymous */}
                <button
                  type="button"
                  onClick={() => setIsAnonymousPost(true)}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    isAnonymousPost
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${isAnonymousPost ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <EyeOff className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Post Anonymously</span>
                      {isAnonymousPost && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      Your identity and real name are hidden. An anonymous alias will be used.
                    </p>
                  </div>
                </button>

                {/* Option 2: Public Profile Name */}
                <button
                  type="button"
                  onClick={() => setIsAnonymousPost(false)}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    !isAnonymousPost
                      ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${!isAnonymousPost ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Post with Name</span>
                      {!isAnonymousPost && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      Show your profile name: <strong className="text-slate-800">{userProfile.displayName || 'Student'}</strong>.
                    </p>
                  </div>
                </button>
              </div>

              {/* Optional Custom Anonymous Alias */}
              {isAnonymousPost && (
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                    <span>Optional Anonymous Handle:</span>
                    <span className="text-slate-400">(leave empty for default)</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Anon_FirstYear_Med, Anon_CapeTown_Peer"
                    value={customAnonAlias}
                    onChange={(e) => setCustomAnonAlias(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Post Author Preview Pill */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Previewing how your post will appear:</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                      isAnonymousPost
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {isAnonymousPost ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {getEffectiveAuthorName(isAnonymousPost, customAnonAlias)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({isAnonymousPost ? 'Anonymous' : 'Public Profile'})
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Topic / Category</label>
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value as StressorCategory)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {STRESSORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Post Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Struggling with NSFAS meal stipend delays during exam week..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">What's on your mind?</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share what you are going through, ask for advice from fellow students, or share what helped you cope..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white bg-slate-50 leading-relaxed"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isAnonymousPost
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isAnonymousPost ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                <span>
                  {isAnonymousPost ? 'Post to Circle Anonymously' : `Post Publicly as ${userProfile.displayName || 'Student'}`}
                </span>
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
          >
            {/* Post Header */}
            <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs font-mono shadow-xs"
                  style={{ backgroundColor: post.avatarColor || (post.isAnonymous ? '#059669' : '#2563eb') }}
                >
                  {post.authorAlias.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{post.authorAlias}</span>
                    {post.isAnonymous ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Shield className="w-2.5 h-2.5" />
                        Anonymous
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <UserCheck className="w-2.5 h-2.5" />
                        Public Profile
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building className="w-3 h-3 text-slate-400" />
                    <span>{post.university}</span>
                    <span>·</span>
                    <span>{post.timestamp}</span>
                  </div>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
                {post.tag}
              </span>
            </div>

            {/* Post Body */}
            <div>
              <h4 className="text-sm font-bold text-slate-900">{post.title}</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                {post.content}
              </p>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleCheer(post.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span className="font-bold">{post.cheers}</span>
                  <span className="text-[11px] hidden sm:inline">Encouragements</span>
                </motion.button>

                <button
                  onClick={() =>
                    setExpandedPostId(expandedPostId === post.id ? null : post.id)
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-bold">{post.repliesCount}</span>
                  <span className="text-[11px] hidden sm:inline">Replies</span>
                </button>
              </div>

              <button
                onClick={() =>
                  setExpandedPostId(expandedPostId === post.id ? null : post.id)
                }
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>{expandedPostId === post.id ? 'Hide Replies' : 'Reply & Support'}</span>
                {expandedPostId === post.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Replies Drawer */}
            {expandedPostId === post.id && (
              <div className="pt-3 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in">
                <div className="space-y-2">
                  {(!post.replies || post.replies.length === 0) ? (
                    <div className="text-xs text-slate-400 text-center py-2">
                      No replies yet. Be the first to send a word of strength!
                    </div>
                  ) : (
                    (post.replies || []).map((r) => (
                      <div key={r.id} className="bg-white p-3 rounded-lg border border-slate-200/70 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">{r.authorAlias}</span>
                            {(r as any).isAnonymous === false ? (
                              <span className="text-[9px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded-full font-medium">
                                Student
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded-full font-medium">
                                Anon
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400">{r.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{r.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Privacy Toggle & Input */}
                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Reply identity:</span>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setIsAnonymousReply(true)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          isAnonymousReply
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Shield className="w-2.5 h-2.5" />
                        Anonymous
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAnonymousReply(false)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          !isAnonymousReply
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <User className="w-2.5 h-2.5" />
                        As {userProfile.displayName ? userProfile.displayName.split(' ')[0] : 'Profile'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={
                        isAnonymousReply
                          ? 'Send an empathetic anonymous reply...'
                          : `Reply as ${userProfile.displayName || 'Student'}...`
                      }
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddReply(post.id);
                      }}
                      className="flex-1 p-2.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddReply(post.id)}
                      className={`p-2.5 text-white rounded-xl cursor-pointer shadow-xs transition-colors ${
                        isAnonymousReply ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
