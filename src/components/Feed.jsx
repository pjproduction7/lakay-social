import React from 'react';
import { Camera, X, Send, Bookmark, MessageSquare, Edit, Trash2 } from 'lucide-react';

export default function Feed({
  trans,
  postTextRef,
  postText,
  postImage,
  postImageInputId,
  handleImageUpload,
  handleCreatePost,
  posts,
  openProfile,
  currentUser,
  isAdmin,
  toggleSave,
  handleToggleLike,
  handleReaction,
  commentRefs,
  commentTexts,
  handleAddComment,
  onEditPost,
  onDeletePost,
  onViewMemorials,
}) {
  return (
    <>
      {/* Create Post */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 rounded-2xl p-6 mb-6 shadow-2xl">
        <h3 className="font-bold text-white text-2xl mb-4">✨ Create a Post</h3>

        <textarea
          ref={postTextRef}
          defaultValue={postText}
          placeholder={trans.createPostPlaceholder}
          className="w-full p-4 rounded-xl border-4 border-white/50 text-gray-900 mb-4 text-lg font-semibold"
          rows={3}
        />

        {postImage && (
          <div className="mb-4 relative">
            <img src={postImage} alt="Preview" className="w-full max-h-60 object-cover rounded-xl border-4 border-white/50 shadow-lg" loading="lazy" />
            <button
              onClick={() => {
                // Parent should control clearing image via passed handler, but simple behavior here:
                if (postTextRef?.current) postTextRef.current.value = '';
              }}
              className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
            >
              <X size={24} />
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <input
            id={postImageInputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <label
            htmlFor={postImageInputId}
            className="flex-1 bg-white text-purple-700 py-3 px-6 rounded-xl cursor-pointer hover:scale-105 transition text-center font-bold"
          >
            <Camera size={24} className="inline mr-2" />
            Add Photo
          </label>
          <button
            onClick={handleCreatePost}
            className="flex-1 bg-white text-pink-700 py-3 px-6 rounded-xl hover:scale-105 transition font-bold"
          >
            Post 🚀
          </button>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-12 text-center shadow-2xl">
            <MessageSquare size={64} className="mx-auto mb-4 text-white" />
            <p className="text-white text-xl font-bold">No posts yet. You can sign in to create a post or explore Memorials.</p>
            <div className="mt-4 flex justify-center gap-3">
              <button onClick={() => onViewMemorials && onViewMemorials()} className="bg-white text-purple-700 py-2 px-4 rounded-lg font-bold">View Memorials</button>
            </div>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-2xl p-6 shadow-2xl border-4 border-white/50">
              {/* Post Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative inline-block group" tabIndex={0}>
                  <div
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold cursor-pointer border-4 border-white shadow-lg text-xl"
                    onClick={() => openProfile(post.user)}
                  >
                    {post.user[0].toUpperCase()}
                  </div>
                  {!currentUser && (
                    <span className="absolute -top-9 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-focus:opacity-100 z-10 whitespace-nowrap" role="tooltip" aria-hidden="true">Please log in to view profiles</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="relative inline-block group" tabIndex={0}>
                    <div
                      className="font-bold text-white text-lg cursor-pointer hover:underline"
                      onClick={() => openProfile(post.user)}
                    >
                      {post.user}
                    </div>
                    {!currentUser && (
                      <span className="absolute -top-9 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-focus:opacity-100 z-10 whitespace-nowrap" role="tooltip" aria-hidden="true">Please log in to view profiles</span>
                    )}
                  </div>
                  <div className="text-sm text-white/80">
                    {new Date(post.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleSave(`post:${post.id}`)} className="text-white hover:scale-110 transition">
                    <Bookmark size={24} />
                  </button>
                  {(currentUser === post.user || isAdmin) && (
                    <>
                      <button
                        onClick={() => {
                          const newContent = prompt("Edit post content:", post.content);
                          if (newContent && newContent.trim() !== post.content) {
                            onEditPost(post.id, newContent.trim());
                          }
                        }}
                        className="text-white hover:scale-110 transition"
                        title="Edit post"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => onDeletePost(post.id)}
                        className="text-red-300 hover:text-red-100 hover:scale-110 transition"
                        title="Delete post"
                      >
                        <Trash2 size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Post Content */}
              <p className="text-white text-lg font-semibold mb-4 bg-black/20 rounded-xl p-4">{post.content}</p>

              {/* Post Image */}
              {post.image && (
                <img src={post.image} alt="Post" className="w-full max-h-96 object-cover rounded-xl mb-4 border-4 border-white shadow-lg" loading="lazy" />
              )}

              {/* Interactions */}
              <div className="mb-4 pb-4 border-b-4 border-white/30">
                <div className="flex items-center gap-4 mb-3">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className={`flex items-center gap-2 text-lg font-bold ${
                      post.likes.includes(currentUser) ? "text-red-600 scale-110" : "text-white hover:scale-110"
                    } transition`}
                  >
                    {post.likes.includes(currentUser) ? "❤️" : "🤍"}
                    <span>{post.likes.length} {post.likes.length === 1 ? "Like" : "Likes"}</span>
                  </button>
                  <button className="flex items-center gap-2 text-white hover:scale-110 transition font-bold text-lg">
                    <MessageSquare size={24} />
                    <span>{post.comments.length} {post.comments.length === 1 ? "Comment" : "Comments"}</span>
                  </button>
                </div>

                {/* Emoji Reactions */}
                <div className="flex gap-3 text-2xl">
                  <button onClick={() => handleReaction(post.id, 'like')} className="bg-white/20 px-3 py-1 rounded-lg hover:scale-110 transition">
                    👍 <span className="text-sm font-bold">{post.reactions.like}</span>
                  </button>
                  <button onClick={() => handleReaction(post.id, 'love')} className="bg-white/20 px-3 py-1 rounded-lg hover:scale-110 transition">
                    ❤️ <span className="text-sm font-bold">{post.reactions.love}</span>
                  </button>
                  <button onClick={() => handleReaction(post.id, 'haha')} className="bg-white/20 px-3 py-1 rounded-lg hover:scale-110 transition">
                    😂 <span className="text-sm font-bold">{post.reactions.haha}</span>
                  </button>
                  <button onClick={() => handleReaction(post.id, 'fire')} className="bg-white/20 px-3 py-1 rounded-lg hover:scale-110 transition">
                    🔥 <span className="text-sm font-bold">{post.reactions.fire}</span>
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-3 mb-4">
                {post.comments.map((comment, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="relative inline-block group" tabIndex={0}>
                      <div
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold cursor-pointer flex-shrink-0 border-2 border-white"
                        onClick={() => openProfile(comment.user)}
                      >
                        {comment.user[0].toUpperCase()}
                      </div>
                      {!currentUser && (
                        <span className="absolute -top-9 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-focus:opacity-100 z-10 whitespace-nowrap" role="tooltip" aria-hidden="true">Please log in to view profiles</span>
                      )}
                    </div>
                    <div className="flex-1 bg-white rounded-xl p-3 shadow-lg">
                      <div className="relative inline-block group" tabIndex={0}>
                        <div
                          className="font-bold text-sm cursor-pointer hover:text-blue-600"
                          onClick={() => openProfile(comment.user)}
                        >
                          {comment.user}
                        </div>
                        {!currentUser && (
                          <span className="absolute -top-9 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-focus:opacity-100 z-10 whitespace-nowrap" role="tooltip" aria-hidden="true">Please log in to view profiles</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-800">{comment.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="flex gap-3">
                <input
                  type="text"
                  ref={(el) => { commentRefs.current[post.id] = el; }}
                  defaultValue={commentTexts[post.id] || ""}
                  placeholder="Write a comment..."
                  className="flex-1 p-3 rounded-xl border-4 border-white/50 text-gray-900 font-semibold"
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                />
                <button
                  onClick={() => handleAddComment(post.id)}
                  className="bg-white px-6 rounded-xl hover:scale-110 transition text-orange-600 font-bold"
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
