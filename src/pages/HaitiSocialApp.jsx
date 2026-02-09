import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Star } from "lucide-react";

// Components
import SpinningLogo from '../components/shared/SpinningLogo';
import Shell from '../components/shared/Shell';
// Home navigation buttons moved into HomeDashboard component
import ChatRoom from '../components/chat/ChatRoom';

import ChangePassword from '../components/auth/ChangePassword';
import AdminPanel from '../components/admin/AdminPanel';
import ModeratorDashboard from '../components/admin/ModeratorDashboard';

import SnakeGame from '../components/games/SnakeGame';
import MemoryGame from '../components/games/MemoryGame';
import TicTacToeGame from '../components/games/TicTacToe';
import PolicyPopup from '../components/PolicyPopup';
import Feed from '../components/Feed';
import PartnerHub from '../components/PartnerHub';
import Music from '../components/Music';
import GamesMenu from '../components/GamesMenu';
import FriendsList from '../components/FriendsList';
import AllUsers from '../components/AllUsers';
import ProfileView from '../components/ProfileView';
import Memorials from '../components/Memorials';
import Classmates from '../components/Classmates';
import PrivateMessages from '../components/PrivateMessages';
import Notifications from '../components/Notifications';
import HomeDashboard from '../components/HomeDashboard';
import Politics from '../components/Politics';
import useGoogleTranslate from '../hooks/useGoogleTranslate';
import useChatSocket from '../hooks/useChatSocket';
import { mergePrivateMessage } from '../utils/privateMessages';


// Services & Utils
import {
  signup,
  login,
  logout,
  getSession,
  getAllUsers,
  getUser,
  updateUserProfile
} from '../services/auth';
import { fetchAllPrivateMessages, sendPrivateMessage as sendPrivateMessageRequest } from '../services/messages';
import { setLanguage } from '../services/i18n';
import {
  uploadProfilePhotos,
  setPrimaryProfilePhoto,
  deleteProfilePhoto,
} from '../services/profilePhotos';
import { loadState, saveState, containsProfanity, validatePassword, validateEmail, compressImage } from '../utils/helpers';
import { BLACKLISTED_POLITICIANS } from '../utils/constants';
import { getApiBaseUrl } from '../services/api';
import { PHOTO_FILTERS, MAX_PROFILE_PHOTOS } from '../../shared/photoFilters';
import {
  fetchPosts,
  createPost as createRemotePost,
  toggleLike as toggleRemoteLike,
  reactToPost as reactToRemotePost,
  addComment as addRemoteComment,
  updatePost,
  deletePost,
} from '../services/feed';

const DEFAULT_FILTER_STYLE = PHOTO_FILTERS.find((filter) => filter.id !== "original")?.id || "original";
const FILTER_LABEL_LOOKUP = PHOTO_FILTERS.reduce((acc, filter) => {
  acc[filter.id] = filter.label;
  return acc;
}, {});

const readEnvValue = (keys, fallback) => {
  for (const key of keys) {
    const metaValue = typeof import.meta !== 'undefined' ? import.meta?.env?.[key] : undefined;
    if (metaValue !== undefined) {
      return metaValue;
    }
  }
  return fallback;
};

const ADMIN_USERNAME = (readEnvValue(['NEXT_PUBLIC_ADMIN_USERNAME', 'VITE_ADMIN_USERNAME'], 'admin') || 'admin').toLowerCase();
const rawAdminPanelEnabled = readEnvValue(
  ['NEXT_PUBLIC_ADMIN_PANEL_ENABLED', 'VITE_ADMIN_PANEL_ENABLED'],
  'true'
);
const ADMIN_PANEL_ENABLED = typeof rawAdminPanelEnabled === 'string'
  ? rawAdminPanelEnabled.toLowerCase() !== 'false'
  : Boolean(rawAdminPanelEnabled);

export default function HaitiSocialApp() {
    // ========== PROFILE EDIT STATE ========== 
    const [editDisplayName, setEditDisplayName] = useState("");
  // ========== ADMIN PANEL STATE ========== 
  const [showModeratorDashboard, setShowModeratorDashboard] = useState(false);
  // ========== ONBOARDING DISMISSED USERS STATE ========== 
  // ========== ONBOARDING DISMISSED USERS STATE ========== 
  // ========== CORE STATE ========== 
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguageState] = useState("en");
  // ... rest of your code
  // ========== CORE STATE ==========

  const [screen, setScreen] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // ========== AUTH STATE ==========
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  // ========== USER DATA ==========
  const [allUsers, setAllUsers] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [following, setFollowing] = useState({});
  const [viewProfileUser, setViewProfileUser] = useState(null);
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  // Admin data
  const [adminUsers, setAdminUsers] = useState([]);
  const [userRoles, setUserRoles] = useState({});
  const [adminStats, setAdminStats] = useState({});
  const [adminLogs, setAdminLogs] = useState({});

  // AI photo filter usage state
  const [aiFiltersEnabled, setAiFiltersEnabled] = useState(false);
  const [selectedFilterStyle, setSelectedFilterStyle] = useState(DEFAULT_FILTER_STYLE);

  // Photo delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePhotoId, setDeletePhotoId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openDeleteModal = (photoId) => {
    setDeletePhotoId(photoId);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeletePhotoId(null);
    setDeleteModalOpen(false);
    setDeleteLoading(false);
  };

  // Pending deletion state (for optimistic undo)
  const [pendingDelete, setPendingDelete] = useState(null);

  const confirmDelete = async () => {
    if (!deletePhotoId) return;
    // Close modal immediately
    setDeleteLoading(true);
    closeDeleteModal();

    // Optimistically hide the photo and schedule deletion with undo
    let timeoutId = null;
    const photoIdToDelete = deletePhotoId;

    const doDelete = async () => {
      try {
        await handleDeletePhoto(photoIdToDelete);
        pushNotif("🗑️ Photo removed");
      } catch (err) {
        console.error(err);
        pushNotif(`❌ Failed to delete photo: ${err?.message || "Unknown error"}`);
      } finally {
        setPendingDelete(null);
        setDeleteLoading(false);
      }
    };

    timeoutId = setTimeout(() => doDelete(), 6000);

    setPendingDelete({ photoId: photoIdToDelete, timeoutId });

    const notifId = pushNotif({
      text: 'Photo deleted',
      actionLabel: 'Undo',
      action: () => {
        // cancel pending deletion
        const pd = pendingDelete || { photoId: photoIdToDelete, timeoutId };
        if (pd && pd.timeoutId) clearTimeout(pd.timeoutId);
        setPendingDelete(null);
        setDeleteLoading(false);
        removeNotification(notifId);
        pushNotif('❎ Deletion undone');
      },
    });

    // If user doesn't undo within timeout, doDelete will run and remove pendingDelete
  };

  // ========== SOCIAL FEED ==========
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const postTextRef = useRef(null);
  const commentRefs = useRef({});

  // ========== CHAT & MESSAGES ==========
  const [messages, setMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [currentChatUser, setCurrentChatUser] = useState(null);
  const [loadingPrivateMessages, setLoadingPrivateMessages] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const otherUsers = useMemo(() => allUsers.filter((user) => user !== currentUser), [allUsers, currentUser]);
  const onlineUsersSet = useMemo(() => new Set(onlineUsers.map((user) => user?.toLowerCase())), [onlineUsers]);
  const currentProfile = currentUser ? profiles[currentUser] : null;
  const profileProgress = useMemo(() => {
    if (!currentUser) {
      return { steps: [], percent: 0, completed: 0, total: 0 };
    }
    const profile = currentProfile || {};
    const steps = [
      {
        id: "photo",
        label: "Add a profile photo",
        complete: Boolean(profile.photoDataUrl || (profile.photos && profile.photos.length > 0)),
      },
      {
        id: "bio",
        label: "Write at least 20 characters in your bio",
        complete: Boolean(profile.bio && profile.bio.trim().length >= 20),
      },
      {
        id: "location",
        label: "Add your city / location",
        complete: Boolean(profile.location && profile.location.trim().length > 0),
      },
      {
        id: "phone",
        label: "Verify your phone number",
        complete: Boolean(profile.phoneVerified),
      },
    ];
    const total = steps.length;
    const completed = steps.filter((step) => step.complete).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { steps, percent, completed, total };
  }, [currentUser, currentProfile]);
  // ========== NOTIFICATIONS ========== 
  const [onboardingDismissedUsers, setOnboardingDismissedUsers] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [savedItems, setSavedItems] = useState([]);

  const pendingProfileSteps = useMemo(() => profileProgress.steps.filter((step) => !step.complete), [profileProgress]);
  const hasCompletedProfile = profileProgress.steps.length > 0 && profileProgress.percent >= 100;
  const hasDismissedOnboarding = currentUser ? Boolean(onboardingDismissedUsers[currentUser.toLowerCase()]) : false;
  const shouldShowOnboardingCard = Boolean(currentUser && !hasCompletedProfile && !hasDismissedOnboarding);


  // ========== MUSIC ==========
  const [musicTracks, setMusicTracks] = useState([
    { id: 1, title: "Konpa Love", artist: "Marie", likes: 45, dislikes: 2 },
    { id: 2, title: "Ayiti Cheri", artist: "Jean", likes: 89, dislikes: 5 },
  ]);

  // ========== GAMES ==========
  const [selectedGame, setSelectedGame] = useState("snake");
  const [gameScore, setGameScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);

  // ========== ADMIN ==========
  const [bannedUsers, setBannedUsers] = useState([]);
  const [shadowBannedUsers, setShadowBannedUsers] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // ========== POLITICAL OPINIONS ==========
  const [politicalOpinions, setPoliticalOpinions] = useState([
    {
      id: 1,
      question: "Haiti has too many political parties (100+)",
      description: "This creates confusion among voters and weakens institutions.",
      agree: 0,
      disagree: 0,
      neutral: 0,
      userVotes: {},
      comments: []
    },
    {
      id: 2,
      question: "Politicians with 10+ years in office should not run again",
      description: "Fresh leadership prevents career politicians and encourages new ideas.",
      agree: 0,
      disagree: 0,
      neutral: 0,
      userVotes: {},
      comments: []
    }
  ]);

  // ========== MEMORIALS ==========
  const [memorials, setMemorials] = useState([]);
  const [memorialPhoto, setMemorialPhoto] = useState(null);
  const [memorialFile, setMemorialFile] = useState(null);
  const memorialNameRef = useRef(null);
  const memorialYearsRef = useRef(null);
  const memorialTributeRef = useRef(null);

  // ========== CLASSMATES ==========
  const [schools, setSchools] = useState([
    { id: "s1", name: "Lycée Toussaint Louverture", city: "Port-au-Prince", department: "Ouest" },
    { id: "s2", name: "Lycée Alexandre Pétion", city: "Port-au-Prince", department: "Ouest" },
    { id: "s3", name: "Lycée Philippe Guerrier", city: "Cap-Haïtien", department: "Nord" },
  ]);
  const [classmatesPosts, setClassmatesPosts] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");

  // CLASSMATES FORM STATE (MOVED TO TOP LEVEL TO FIX HOOKS ERROR)
  const [classmateName, setClassmateName] = useState("");
  const [classmateYear, setClassmateYear] = useState("");
  const [classmateMessage, setClassmateMessage] = useState("");
  const [replyTexts, setReplyTexts] = useState({});

  // ========== CLASSMATES POST HANDLER ========== 
  const handleCreateClassmatePost = () => {
    if (!selectedSchoolId || !classmateName) {
      pushNotif("Please select a school and enter a classmate name.");
      return;
    }
    const school = schools.find((s) => s.id === selectedSchoolId);
    const newPost = {
      id: Date.now().toString(),
      lookingFor: classmateName,
      year: classmateYear,
      message: classmateMessage,
      postedBy: currentUser || "Anonymous",
      schoolName: school ? school.name : "",
      city: school ? school.city : "",
      department: school ? school.department : "",
      replies: [],
    };
    setClassmatesPosts((prev) => [newPost, ...prev]);
    setClassmateName("");
    setClassmateYear("");
    setClassmateMessage("");
    pushNotif("✅ Classmate request posted!");
  };
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolCity, setNewSchoolCity] = useState("");
  const [newSchoolDepartment, setNewSchoolDepartment] = useState("");

  // ========== MODALS ==========
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [, setOnboardingModalOpen] = useState(false);

  useGoogleTranslate(language);

  // ========== COLORS ==========
  const bgColor = darkMode ? "bg-gray-900" : "bg-gradient-to-br from-blue-600 via-red-600 to-blue-800";
  const textColor = "text-white";
  const cardBg = darkMode ? "bg-gradient-to-br from-gray-800 to-gray-900" : "bg-gradient-to-br from-white to-blue-50";

  // ========== TRANSLATIONS ==========
  const translations = {
    en: {
      appName: "Lakay Social",
      home: "Home",
      music: "Music",
      games: "Games",
      chat: "Public Chat",
      feed: "Feed",
      friends: "Friends",
      classmates: "Classmates",
      login: "Login",
      createAccount: "Create Account",
      logout: "Logout",
      search: "Search",
      saved: "Saved",
      notifications: "Notifications",
      privateMessages: "Private Messages",
      createPostPlaceholder: "What's on your mind?",
      chatPlaceholder: "Type a message...",
      partnerHub: "Partner With Us",
    },
    ht: {
      appName: "Lakay Social",
      home: "Lakay",
      music: "Mizik",
      games: "Jwèt yo",
      chat: "Chat Piblik",
      feed: "Paj",
      friends: "Zanmi",
      classmates: "Kamarad Lekòl",
      login: "Konekte",
      createAccount: "Kreye Kont",
      logout: "Soti",
      search: "Chèche",
      saved: "Anrejistre",
      notifications: "Notifikasyon",
      privateMessages: "Mesaj Prive",
      createPostPlaceholder: "Kisa w ap panse?",
      chatPlaceholder: "Tape yon mesaj...",
      partnerHub: "Vin patnè avèk nou",
    },
    fr: {
      appName: "Lakay Social",
      home: "Accueil",
      music: "Musique",
      games: "Jeux",
      chat: "Chat Public",
      feed: "Fil",
      friends: "Amis",
      classmates: "Anciens camarades",
      login: "Connexion",
      createAccount: "Créer un compte",
      logout: "Déconnexion",
      search: "Rechercher",
      saved: "Enregistré",
      notifications: "Notifications",
      privateMessages: "Messages Privés",
      createPostPlaceholder: "Qu'avez-vous à partager ?",
      chatPlaceholder: "Tapez un message...",
      partnerHub: "Devenir partenaire",
    },
    es: {
      appName: "Lakay Social",
      home: "Inicio",
      music: "Música",
      games: "Juegos",
      chat: "Chat Público",
      feed: "Feed",
      friends: "Amigos",
      classmates: "Compañeros",
      login: "Iniciar sesión",
      createAccount: "Crear cuenta",
      logout: "Cerrar sesión",
      search: "Buscar",
      saved: "Guardado",
      notifications: "Notificaciones",
      privateMessages: "Mensajes Privados",
      createPostPlaceholder: "¿Qué estás pensando?",
      chatPlaceholder: "Escribe un mensaje...",
      partnerHub: "Sé nuestro socio",
    }
  };

  const trans = translations[language] || translations.en;
  const postImageInputId = "post-image-upload";

  const normalizeProfile = (profile) => {
    if (!profile) {
      return {
        username: "",
        displayName: "",
        bio: "",
        location: "",
        photoDataUrl: "",
        photos: [],
      };
    }

    if (typeof profile === "string") {
      return {
        username: profile,
        displayName: profile,
        bio: "",
        location: "",
        photoDataUrl: "",
        photos: [],
      };
    }

    const normalizedPhotos = Array.isArray(profile.photos)
      ? profile.photos.map(photo => ({
          ...photo,
          photo_url: photo.photo_url
        }))
      : Array.isArray(profile.profile?.photos)
        ? profile.profile.photos.map(photo => ({
            ...photo,
            photo_url: photo.photo_url
          }))
        : [];
    const primaryPhoto = normalizedPhotos.find((photo) => photo.is_primary) || normalizedPhotos[0];

    return {
      username: profile.username || profile.displayName || profile.display_name || "",
      displayName: profile.displayName || profile.display_name || profile.username || "",
      bio: profile.bio || profile.profile?.bio || "",
      location: profile.location || profile.profile?.location || "",
      photoDataUrl:
        profile.photoDataUrl ||
        profile.photo_url ||
        primaryPhoto?.photo_url ||
        profile.profile?.photoDataUrl ||
        "",
      photos: normalizedPhotos,
    };
  };

  // ========== HELPER FUNCTIONS ==========
  
  const pushNotif = useCallback((arg) => {
    const id = Date.now();
    const notif = typeof arg === 'string' ? { id, text: arg } : { id, ...arg };
    setNotifications((prev) => [notif, ...prev]);
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const list = await getAllUsers();
      const normalizedProfiles = {};
      const usernames = [];
      list.forEach((profile) => {
        const normalized = normalizeProfile(profile);
        if (!normalized.username) return;
        usernames.push(normalized.username);
        normalizedProfiles[normalized.username] = normalized;
      });
      setAllUsers(usernames);
      setProfiles((prev) => {
        const next = { ...prev };
        Object.entries(normalizedProfiles).forEach(([key, normalized]) => {
          const existing = prev[key];
          next[key] = {
            ...existing,
            ...normalized,
            photos:
              Array.isArray(normalized.photos) && normalized.photos.length > 0
                ? normalized.photos
                : existing?.photos || [],
            photoDataUrl:
              normalized.photoDataUrl || existing?.photoDataUrl || normalized.photos?.[0]?.photo_url || "",
          };
        });
        return next;
      });
    } catch (err) {
      console.error(err);
      pushNotif(`❌ Failed to load user profiles: ${err?.message || "Unknown error"}`);
    }
  }, [pushNotif]);

  const refreshAdminData = useCallback(async () => {
    console.log(`refreshAdminData called, isAdmin=${isAdmin}`);
    if (!isAdmin) return;
    try {
      const { getAllUsers: getAdminUsers, getAdminStats, getAdminLogs } = await import('../services/auth');
      const [usersRes, statsRes, logsRes] = await Promise.all([
        getAdminUsers(),
        getAdminStats(),
        getAdminLogs(),
      ]);
      setAdminUsers(usersRes);
      setAdminStats(statsRes);
      setAdminLogs(logsRes);
      // Load roles for each user
      const roles = {};
      for (const user of usersRes) {
        try {
          const userRolesRes = await getUserRoles(user.username);
          roles[user.username] = userRolesRes.roles || [];
        } catch (e) {
          roles[user.username] = [];
        }
      }
      setUserRoles(roles);
    } catch (err) {
      console.error(err);
      if (err?.message?.includes('Admin access required')) {
        console.log('Admin access denied by server, resetting admin status');
        setIsAdmin(false);
        pushNotif('⚠️ Admin access denied. Please log in as admin.');
      } else {
        pushNotif(`❌ Failed to load admin data: ${err?.message || "Unknown error"}`);
      }
    }
  }, [isAdmin, pushNotif]);

  const mapRemotePrivateMessage = useCallback(
    (remote) => {
      if (!remote) {
        return null;
      }

      const timestamp = remote.created_at ? new Date(remote.created_at) : new Date();
      const sender = remote.sender || remote.from || "";
      const recipient = remote.recipient || remote.to || "";
      return {
        id: remote.id ?? `${sender}-${timestamp.getTime()}`,
        from: sender,
        to: recipient,
        message: remote.content || remote.message || "",
        createdAt: timestamp.toISOString(),
        time: timestamp.toLocaleTimeString(),
        read: sender?.toLowerCase() === currentUser?.toLowerCase(),
      };
    },
    [currentUser]
  );


  const refreshPrivateMessages = useCallback(async () => {
    if (!currentUser) {
      return;
    }

    setLoadingPrivateMessages(true);
    try {
      const list = await fetchAllPrivateMessages();
      setPrivateMessages((prev) => {
        const readLookup = new Map(prev.map((msg) => [msg.id, msg.read]));
        return list
          .map(mapRemotePrivateMessage)
          .filter(Boolean)
          .map((msg) => ({ ...msg, read: readLookup.get(msg.id) ?? msg.read ?? false }));
      });
    } catch (err) {
      console.error("Failed to refresh private messages", err);
      pushNotif(`⚠️ Could not refresh private messages: ${err?.message || "Unknown error"}`);
    } finally {
      setLoadingPrivateMessages(false);
    }
  }, [currentUser, pushNotif]);

  const handleRealtimePrivateMessage = useCallback(
    (payload) => {
      const mapped = mapRemotePrivateMessage(payload);
      if (!mapped) {
        return;
      }
      setPrivateMessages((prev) => mergePrivateMessage(prev, mapped));
    },
    [mapRemotePrivateMessage]
  );

  const handleSendPrivateChatMessage = useCallback(
    async (recipient, content) => {
      if (!currentUser) {
        const err = new Error("Please log in to send messages");
        pushNotif("⚠️ Please log in to send messages");
        throw err;
      }

      const cleanRecipient = recipient?.trim();
      const cleanMessage = content?.trim();
      if (!cleanRecipient || !cleanMessage) {
        return;
      }

      try {
        const created = await sendPrivateMessageRequest({ recipient: cleanRecipient, content: cleanMessage });
        const mapped = mapRemotePrivateMessage(created);
        if (mapped) {
          setPrivateMessages((prev) => {
            const exists = prev.some((m) => m.id === mapped.id);
            if (exists) {
              return prev.map((m) => (m.id === mapped.id ? { ...m, ...mapped } : m));
            }
            return [...prev, mapped];
          });
        }
      } catch (err) {
        console.error(err);
        const message = err?.message || "Failed to send message";
        pushNotif(`❌ ${message}`);
        throw err;
      }
    },
    [currentUser, mapRemotePrivateMessage, pushNotif]
  );

  useChatSocket({
    currentUser,
    onPrivateMessage: handleRealtimePrivateMessage,
    onPresenceUpdate: setOnlineUsers,
  });

  const loadFeed = useCallback(async () => {
    try {
      const remotePosts = await fetchPosts();
      const formatted = remotePosts.map((post) => ({
        id: post.id,
        user: post.user,
        content: post.content,
        image: post.image,
        likes: Array.isArray(post.likes) ? post.likes : [],
        reactions: {
          like: post.reactions?.like || 0,
          love: post.reactions?.love || 0,
          haha: post.reactions?.haha || 0,
          fire: post.reactions?.fire || 0,
        },
        comments: Array.isArray(post.comments) ? post.comments : [],
        timestamp: post.timestamp,
      }));
      setPosts(formatted);

      // Load memorials from posts
      const memorialsFromPosts = remotePosts
        .filter(post => {
          // Memorials have content with double newline separating name/years from tribute
          const lines = post.content.split('\n');
          return lines.length >= 2 && lines[1] === '';
        })
        .map(post => {
          const content = post.content;
          const lines = content.split('\n');
          
          // Parse name and years from first line
          const firstLine = lines[0];
          let name = firstLine;
          let years = '';
          
          // Check if first line contains years in parentheses
          const yearMatch = firstLine.match(/^(.+?)\s*\(([^)]+)\)$/);
          if (yearMatch) {
            name = yearMatch[1].trim();
            years = yearMatch[2].trim();
          }
          
          // Everything after the blank line is the tribute
          const tribute = lines.slice(2).join('\n').trim();
          
          return {
            id: post.id,
            name,
            years,
            tribute,
            photo: post.image,
            author: post.user,
            timestamp: post.timestamp,
            condolences: Array.isArray(post.comments) ? post.comments.map(comment => ({
              id: comment.id || `cond_${Date.now()}_${Math.random()}`,
              author: comment.user || comment.author || 'Anonymous',
              text: comment.text || comment.content || '',
              timestamp: comment.timestamp,
            })) : [],
          };
        });
      
      setMemorials(memorialsFromPosts);
    } catch (err) {
      console.error(err);
      pushNotif(`❌ Failed to load feed: ${err?.message || "Unknown error"}`);
    }
  }, [pushNotif]);

  const loadProfile = useCallback(async (username) => {
    if (!username) return;
    try {
      const remoteProfile = await getUser(username);
      setProfiles((prev) => ({
        ...prev,
        [username]: normalizeProfile(remoteProfile),
      }));
    } catch (err) {
      console.error(`Failed to load profile for ${username}`, err);
      pushNotif(`⚠️ Could not load profile for ${username}: ${err?.message || "Unknown error"}`);
    }
  }, [pushNotif]);

  const toggleSave = (key) => {
    setSavedItems((prev) => 
      prev.includes(key) ? prev.filter((x) => x !== key) : [key, ...prev]
    );
  };

  const handleProfilePhotoUpload = useCallback(
    async (fileList) => {
      if (!currentUser) {
        pushNotif("⚠️ Please log in to update your profile");
        return;
      }

      if (!fileList?.length) {
        return;
      }

      setIsUploadingPhotos(true);
      try {
        const filterToUse = aiFiltersEnabled ? selectedFilterStyle : "original";
        await uploadProfilePhotos({ files: fileList, filter: filterToUse });
        await loadProfile(currentUser);
        await refreshUsers();
        pushNotif("📸 Photo uploaded");
      } catch (err) {
        console.error(err);
        pushNotif(`❌ Failed to upload photo: ${err?.message || "Unknown error"}`);
      } finally {
        setIsUploadingPhotos(false);
      }
    },
    [currentUser, loadProfile, refreshUsers, pushNotif]
  );

  const handleSetPrimaryPhoto = useCallback(
    async (photoId) => {
      if (!currentUser) {
        return;
      }
      if (!photoId) {
        console.warn('handleSetPrimaryPhoto called without photoId');
        return;
      }
      try {
        await setPrimaryProfilePhoto({ photoId });
        await loadProfile(currentUser);
        await refreshUsers();
        pushNotif("⭐ Primary photo updated");
      } catch (err) {
        console.error(err);
        pushNotif(`❌ Failed to set primary photo: ${err?.message || "Unknown error"}`);
      }
    },
    [currentUser, loadProfile, refreshUsers, pushNotif]
  );

  const handleSaveProfile = async (u) => {
    if (!currentUser) {
      pushNotif("⚠️ Please log in to update your profile");
      return;
    }

    try {
      await updateUserProfile({
        displayName: editDisplayName || currentUser,
        bio: editBio,
        location: editLocation,
      });

      setProfiles((prev) => ({
        ...prev,
        [u]: { ...(prev[u] || {}), displayName: editDisplayName, bio: editBio, location: editLocation },
      }));

      await loadProfile(currentUser);
      await refreshUsers();
      pushNotif("✅ Profile updated!");
      setTimeout(() => setScreen("home"), 1000);
    } catch (err) {
      pushNotif(`❌ Failed to update profile: ${err?.message || "Unknown error"}`);
    }
  };

  const handleDeletePhoto = useCallback(
    async (photoId) => {
      if (!currentUser) {
        return;
      }
      if (!photoId) {
        console.warn('handleDeletePhoto called without photoId');
        throw new Error('photoId is required');
      }

      try {
        await deleteProfilePhoto({ photoId });
        await loadProfile(currentUser);
        await refreshUsers();
      } catch (err) {
        console.error(err);
        throw err;
      }
    },
    [currentUser, loadProfile, refreshUsers]
  );

  const openProfile = (user) => {
    const targetUsername = typeof user === 'string' ? user : (user?.username || currentUser);
    if (!targetUsername) return;

    setViewProfileUser(targetUsername);

    if (!profiles[targetUsername]) {
      setProfiles(prev => ({
        ...prev,
        [targetUsername]: { 
          username: targetUsername, 
          displayName: targetUsername, 
          bio: "", 
          location: "",
          photoDataUrl: "",
          photos: [],
        }
      }));
      setEditBio("");
      setEditLocation("");
    } else {
      const p = profiles[targetUsername] || { bio: "", location: "" };
      setEditBio(p.bio || "");
      setEditLocation(p.location || "");
    }

    setScreen("profile");
  };

  const getTotalUnreadCount = () => {
    if (!currentUser) {
      return 0;
    }
    return privateMessages.filter((msg) => msg.to === currentUser && !msg.read).length;
  };

  const getUnreadCount = (username) => {
    if (!currentUser || !username) {
      return 0;
    }
    return privateMessages.filter(
      (msg) => msg.from === username && msg.to === currentUser && !msg.read
    ).length;
  };

  const markMessagesAsRead = (username) => {
    if (!username) {
      return;
    }
    setPrivateMessages((prev) =>
      prev.map((msg) => {
        if (
          (msg.from === username && msg.to === currentUser) ||
          (msg.from === currentUser && msg.to === username)
        ) {
          return { ...msg, read: true };
        }
        return msg;
      })
    );
  };

  // Onboarding dismiss handled inline where needed (handler removed)

  // ========== EFFECTS ==========

  // Load state on mount
  useEffect(() => {
    const saved = loadState() || {};
    if (saved.language) {
      setLanguageState(saved.language);
      setLanguage(saved.language);
    }
    if (typeof saved.darkMode === "boolean") setDarkMode(saved.darkMode);
    if (saved.policyAccepted) setPolicyAccepted(true);
    if (Array.isArray(saved.notifications)) setNotifications(saved.notifications);
    if (Array.isArray(saved.savedItems)) setSavedItems(saved.savedItems);
    if (Array.isArray(saved.messages)) setMessages(saved.messages);
    if (Array.isArray(saved.privateMessages)) setPrivateMessages(saved.privateMessages);
    if (saved.following) setFollowing(saved.following);
    if (Array.isArray(saved.schools)) setSchools(saved.schools);
    if (Array.isArray(saved.classmatesPosts)) setClassmatesPosts(saved.classmatesPosts);
    if (Array.isArray(saved.moderators)) setModerators(saved.moderators);
    if (Array.isArray(saved.bannedUsers)) setBannedUsers(saved.bannedUsers);
    if (Array.isArray(saved.shadowBannedUsers)) setShadowBannedUsers(saved.shadowBannedUsers);
    if (saved.onboardingDismissedUsers) setOnboardingDismissedUsers(saved.onboardingDismissedUsers);
  }, []);

  // Save state on changes
  useEffect(() => {
    saveState({
      language,
      darkMode,
      policyAccepted,
      notifications,
      savedItems,
      messages,
      privateMessages,
      following,
      schools,
      classmatesPosts,
      currentUser,
      isAdmin,
      profiles,
      moderators,
      bannedUsers,
      shadowBannedUsers,
      onboardingDismissedUsers
    });
  }, [
    language,
    darkMode,
    policyAccepted,
    notifications,
    savedItems,
    messages,
    privateMessages,
    following,
    schools,
    classmatesPosts,
    currentUser,
    isAdmin,
    profiles,
    moderators,
    bannedUsers,
    shadowBannedUsers,
    onboardingDismissedUsers
  ]);

  // Auto-login if session exists
  useEffect(() => {
    const session = getSession();
    if (!session?.username) {
      return;
    }

    setCurrentUser(session.username);
    console.log(`Session loaded: username=${session.username}, ADMIN_USERNAME=${ADMIN_USERNAME}, isAdmin=${session.username?.toLowerCase() === ADMIN_USERNAME}`);
    setIsAdmin(session.username?.toLowerCase() === ADMIN_USERNAME);
    setScreen("home");

    refreshUsers();
    loadFeed();
    loadProfile(session.username);
    refreshPrivateMessages();
  }, [refreshUsers, loadFeed, loadProfile, refreshPrivateMessages]);

  // Ensure current user has profile
  useEffect(() => {
    if (!currentUser) return;
    loadProfile(currentUser);
  }, [currentUser, loadProfile]);

  useEffect(() => {
    const bootstrapFilterMetadata = async () => {
      try {
        // Photo filters are static and always available
        setAiFiltersEnabled(true);
      } catch (err) {
        console.warn("Failed to load filter metadata", err);
      }
    };

    bootstrapFilterMetadata();
  }, []);

  useEffect(() => {
    if (screen === "privateMessages" && currentUser) {
      refreshPrivateMessages();
    }
  }, [screen, currentUser, refreshPrivateMessages]);

  useEffect(() => {
    if (!aiFiltersEnabled && selectedFilterStyle !== "original") {
      setSelectedFilterStyle("original"); // Removed filter-related effects
    }
  }, [aiFiltersEnabled, selectedFilterStyle]);

  // Load admin data when admin panel opens
  useEffect(() => {
    if (showAdminPanel && isAdmin) {
      refreshAdminData();
    }
  }, [showAdminPanel, isAdmin, refreshAdminData]);

  useEffect(() => {
    if (!currentUser) {
      setOnboardingModalOpen(false);
      return;
    }
    if (!hasCompletedProfile && !hasDismissedOnboarding) {
      setOnboardingModalOpen(true);
    } else {
      setOnboardingModalOpen(false);
    }
  }, [currentUser, hasCompletedProfile, hasDismissedOnboarding]);

  // ========== AUTH HANDLERS ==========

  const handleAuth = async () => {
    try {
      const cleanUsername = username.trim();
      const cleanPassword = password.trim();
      const normalizedUsername = cleanUsername.toLowerCase();
      setAuthError("");

      if (!cleanUsername || !cleanPassword) {
        setAuthError("Please fill in all fields");
        return;
      }

      if (!isLogin) {
        if (!email.trim()) {
          setAuthError("Email is required");
          return;
        }

        if (!validateEmail(email)) {
          setAuthError("Please enter a valid email address");
          return;
        }

        const passwordErrors = validatePassword(cleanPassword);
        if (passwordErrors.length > 0) {
          setAuthError(passwordErrors[0]);
          return;
        }

        if (cleanPassword !== confirmPassword) {
          setAuthError("Passwords do not match");
          return;
        }

        if (!agreedToTerms) {
          setAuthError("You must agree to the Terms of Service");
          return;
        }
      }

      setIsAdmin(false);

      let result;
      if (isLogin) {
        try {
          result = await login({ username: normalizedUsername, password: cleanPassword });
        } catch (loginError) {
          const msg = loginError?.message || "Login failed";
          setAuthError(msg);
          pushNotif(`❌ ${msg}`);
          return;
        }
      } else {
        try {
          result = await signup({ 
            username: normalizedUsername, 
            password: cleanPassword,
            email: email.trim()
          });
        } catch (signupError) {
          const msg = signupError?.message || "Signup failed";
          setAuthError(msg);
          pushNotif(`❌ ${msg}`);
          return;
        }
      }

      const sessionUsername = result?.session?.username || result?.user?.username || cleanUsername;
      setCurrentUser(sessionUsername);
      setIsAdmin(sessionUsername?.toLowerCase() === ADMIN_USERNAME);
      setScreen("home");
      pushNotif(`👋 Welcome ${sessionUsername}!`);

      await refreshUsers();
      await refreshPrivateMessages();

      setUsername("");
      setPassword("");
      setEmail("");
      setConfirmPassword("");
      setAgreedToTerms(false);
    } catch (err) {
      pushNotif(`❌ Error: ${err.message}`);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setIsAdmin(false);
    setScreen("login");
    setNotifications([]);
    setCurrentChatUser(null);
    setPrivateMessages([]);
  };

  // ========== POST HANDLERS ==========

  const handleCreatePost = async () => {
    const text = postTextRef.current?.value || postText;
    if (!currentUser) {
      pushNotif("⚠️ Please log in to post");
      return;
    }

    if (!text.trim() && !postImage) {
      pushNotif("⚠️ Post cannot be empty");
      return;
    }

    if (containsProfanity(text)) {
      pushNotif("🚫 Post contains inappropriate language");
      return;
    }

    try {
      await createRemotePost({ content: text.trim(), image: postImage });
      if (postTextRef.current) postTextRef.current.value = "";
      setPostText("");
      setPostImage(null);
      pushNotif("✅ Post published!");
      await loadFeed();
    } catch (err) {
      pushNotif(`❌ Failed to create post: ${err?.message || "Unknown error"}`);
    }
  };

  const handleToggleLike = async (postId) => {
    if (!currentUser) {
      pushNotif("⚠️ Please log in to like posts");
      return;
    }

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isLiked = post.likes.includes(currentUser);
          return {
            ...post,
            likes: isLiked
              ? post.likes.filter((u) => u !== currentUser)
              : [...post.likes, currentUser],
          };
        }
        return post;
      })
    );

    try {
      await toggleRemoteLike(postId);
      await loadFeed();
    } catch (err) {
      pushNotif(`❌ Could not update like: ${err?.message || "Unknown error"}`);
      await loadFeed();
    }
  };

  const handleReaction = async (postId, reactionType) => {
    if (!currentUser) {
      pushNotif("⚠️ Please log in to react to posts");
      return;
    }

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const currentCount = post.reactions?.[reactionType] || 0;
          return {
            ...post,
            reactions: {
              ...post.reactions,
              [reactionType]: currentCount + 1,
            },
          };
        }
        return post;
      })
    );

    try {
      await reactToRemotePost(postId, reactionType);
      await loadFeed();
    } catch (err) {
      pushNotif(`❌ Could not react to post: ${err?.message || "Unknown error"}`);
      await loadFeed();
    }
  };

  const handleAddComment = async (postId) => {
    const commentText = (commentRefs.current[postId]?.value ?? commentTexts[postId] ?? "").trim();
    if (!commentText) return;
    if (!currentUser) {
      pushNotif("⚠️ Please log in to comment");
      return;
    }

    try {
      await addRemoteComment(postId, commentText);
      if (commentRefs.current[postId]) commentRefs.current[postId].value = "";
      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
      pushNotif("💬 Comment posted!");
      await loadFeed();
    } catch (err) {
      pushNotif(`❌ Failed to add comment: ${err?.message || "Unknown error"}`);
    }
  };

  const handleEditPost = async (postId, newContent) => {
    if (!currentUser) {
      pushNotif("⚠️ Please log in to edit posts");
      return;
    }

    try {
      await updatePost(postId, { content: newContent });
      pushNotif("✏️ Post updated!");
      await loadFeed();
    } catch (err) {
      pushNotif(`❌ Failed to update post: ${err?.message || "Unknown error"}`);
      await loadFeed();
    }
  };

  const handleDeletePost = async (postId) => {
    if (!currentUser) {
      pushNotif("⚠️ Please log in to delete posts");
      return;
    }

    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await deletePost(postId);
      pushNotif("🗑️ Post deleted!");
      await loadFeed();
    } catch (err) {
      pushNotif(`❌ Failed to delete post: ${err?.message || "Unknown error"}`);
      await loadFeed();
    }
  };

  const handleEditMemorial = async (memorialId, newName, newYears, newTribute) => {
    if (!currentUser) {
      pushNotif("⚠️ Please log in to edit memorials");
      return;
    }

    try {
      const content = `${newName}${newYears ? ` (${newYears})` : ""}\n\n${newTribute}`;
      await updatePost(memorialId, { content });
      pushNotif("✏️ Memorial updated!");
      await loadFeed(); // Reload to ensure memorials are up to date
    } catch (err) {
      pushNotif(`❌ Failed to update memorial: ${err?.message || "Unknown error"}`);
    }
  };

  const handleDeleteMemorial = async (memorialId) => {
    if (!currentUser) {
      pushNotif("⚠️ Please log in to delete memorials");
      return;
    }

    if (!confirm("Are you sure you want to delete this memorial?")) {
      return;
    }

    try {
      await deletePost(memorialId);
      pushNotif("🗑️ Memorial deleted!");
      await loadFeed(); // Reload to ensure memorials are up to date
    } catch (err) {
      pushNotif(`❌ Failed to delete memorial: ${err?.message || "Unknown error"}`);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        pushNotif("⚠️ Please upload an image file");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        pushNotif("⚠️ Image too large. Max 5MB");
        return;
      }

      const compressed = await compressImage(file);
      setPostImage(compressed);
      pushNotif("✅ Image added");
    }
  };

  // ========== MUSIC HANDLERS ==========

  const handleMusicUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      if (file.size > 10 * 1024 * 1024) {
        pushNotif("⚠️ Audio file too large. Max 10MB");
        return;
      }
      
      const title = prompt("Enter song title:", file.name.replace(/\.[^/.]+$/, ""));
      if (!title || !title.trim()) {
        pushNotif("⚠️ Song title required");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const newTrack = {
          id: Date.now(),
          title: title.trim(),
          artist: currentUser,
          likes: 0,
          dislikes: 0,
          audioUrl: reader.result,
        };
        setMusicTracks(prev => [newTrack, ...prev]);
        pushNotif(`🎵 "${title.trim()}" uploaded!`);
      };
      reader.readAsDataURL(file);
    };
    
    input.click();
  };

  // ========== GAME HANDLERS ==========

  const startGame = () => {
    setGameActive(true);
    setGameScore(0);
  };

  // ========== POLITICAL OPINION HANDLERS ==========

  const handleVoteOpinion = (opinionId, voteType) => {
    setPoliticalOpinions(prev => 
      prev.map(op => {
        if (op.id === opinionId) {
          const previousVote = op.userVotes[currentUser];
          const updated = { ...op };
          
          if (previousVote) {
            updated[previousVote]--;
          }
          
          updated[voteType]++;
          updated.userVotes = { ...updated.userVotes, [currentUser]: voteType };
          
          return updated;
        }
        return op;
      })
    );
    pushNotif(`✅ Vote recorded: ${voteType}`);
  };

  const handleCommentOpinion = (opinionId, commentText) => {
    if (!commentText.trim()) return;
    
    setPoliticalOpinions(prev =>
      prev.map(op => {
        if (op.id === opinionId) {
          return {
            ...op,
            comments: [
              ...op.comments,
              {
                id: Date.now(),
                user: currentUser,
                text: commentText.trim(),
                timestamp: Date.now(),
                likes: 0
              }
            ]
          };
        }
        return op;
      })
    );
  };

  const handleLikeComment = (opinionId, commentId) => {
    setPoliticalOpinions(prev => prev.map(op => {
      if (op.id === opinionId) {
        return {
          ...op,
          comments: op.comments.map(c => 
            c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
          )
        };
      }
      return op;
    }));
  };

  // ========== MEMORIAL HANDLERS ==========

  const handleCreateMemorial = async () => {
    const name = memorialNameRef.current?.value || "";
    const years = memorialYearsRef.current?.value || "";
    const tribute = memorialTributeRef.current?.value || "";

    if (!name.trim() || !tribute.trim()) {
      pushNotif("⚠️ Please fill in name and tribute");
      return;
    }

    try {
      let imageUrl = null;

      if (memorialFile) {
        setIsUploadingPhotos(true);
        const uploadRes = await uploadProfilePhotos({ files: [memorialFile], addToProfile: false });
        setIsUploadingPhotos(false);
        if (uploadRes && uploadRes.photos && uploadRes.photos.length > 0) {
          imageUrl = uploadRes.photos[0].photo_url;
        }
      }

      const content = `${name}${years ? ` (${years})` : ""}\n\n${tribute}`;
      const created = await createRemotePost({ content, image: imageUrl });

      // Normalize into a memorial object used by the Memorials list
      const newMemorial = {
        id: created?.id || `mem_${Date.now()}`,
        name: name.trim(),
        years: years.trim(),
        tribute: tribute.trim(),
        photo: imageUrl || null,
        author: currentUser || created?.user || 'Anonymous',
        timestamp: created?.timestamp || Date.now(),
        condolences: [],
      };

      setMemorials(prev => [newMemorial, ...(prev || [])]);

      // Clear inputs
      if (memorialNameRef.current) memorialNameRef.current.value = "";
      if (memorialYearsRef.current) memorialYearsRef.current.value = "";
      if (memorialTributeRef.current) memorialTributeRef.current.value = "";
      setMemorialPhoto(null);
      setMemorialFile(null);

      pushNotif("✅ Memorial created");
      await loadFeed(); // Reload to ensure memorials are up to date
    } catch (err) {
      setIsUploadingPhotos(false);
      console.error('Failed to create memorial', err);
      pushNotif(`❌ Failed to create memorial: ${err.message || 'Server error'}`);
    }
  };

  const handleAddCondolence = useCallback(async (memorialId, text) => {
    if (!text || !text.trim()) return;
    if (!currentUser) {
      pushNotif("⚠️ Please log in to add condolences");
      return;
    }

    try {
      await addRemoteComment(memorialId, text.trim());
      pushNotif('💐 Condolence posted!');
      await loadFeed(); // Reload to get updated condolences from comments
    } catch (err) {
      pushNotif(`❌ Failed to add condolence: ${err?.message || "Unknown error"}`);
    }
  }, [currentUser, pushNotif, addRemoteComment, loadFeed]);

  const handleAddSchool = () => {
    if (!newSchoolName.trim() || !newSchoolCity.trim() || !newSchoolDepartment.trim()) {
      pushNotif("⚠️ Please fill in all school fields");
      return;
    }

    const newSchool = {
      id: `s_${Date.now()}`,
      name: newSchoolName.trim(),
      city: newSchoolCity.trim(),
      department: newSchoolDepartment.trim()
    };

    setSchools(prev => [...prev, newSchool]);
    setSelectedSchoolId(newSchool.id);
    setNewSchoolName("");
    setNewSchoolCity("");
    setNewSchoolDepartment("");
    setShowAddSchool(false);
    pushNotif("✅ School added successfully!");
  };

  const handleReplyToPost = (postId) => {
    const text = (replyTexts[postId] || "").trim();
    if (!text) return;

    setClassmatesPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { 
              ...p, 
              replies: [
                ...p.replies, 
                { id: `r_${Date.now()}`, by: currentUser, text, at: Date.now() }
              ] 
            }
          : p
      )
    );

    setReplyTexts(prev => ({ ...prev, [postId]: "" }));
    pushNotif("✅ Reply posted!");
  };

  // ========== RENDER: LOGIN SCREEN ==========
  
  if (screen === "login") {
    if (!policyAccepted) {
      return <PolicyPopup onAccept={() => setPolicyAccepted(true)} />;
    }

    return (
      <div className={`min-h-screen ${bgColor} p-4 flex items-center justify-center`}>
        <div className="max-w-md w-full">
          {/* Language Selector */}
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {["en", "ht", "fr", "es"].map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setLanguageState(lang);
                  setLanguage(lang);
                }}
                className={`px-3 py-2 rounded-lg font-bold transition-all ${
                  language === lang ? "bg-red-600 text-white scale-110" : "bg-white text-blue-900"
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <SpinningLogo />

          <div className="text-center mb-6">
            <div className="lakay-hero-pill mx-auto mb-3">
              <span>Welcome Home</span>
            </div>
            <h2 className="lakay-hero-title">Lakay Social</h2>
            <p className="lakay-hero-subtitle mt-2">
              <span className="lakay-hero-word lakay-hero-ayiti">Ayiti</span>
              <span className="lakay-hero-divider">•</span>
              <span className="lakay-hero-word lakay-hero-diaspora">Diaspora</span>
              <span className="lakay-hero-divider">•</span>
              <span className="lakay-hero-word lakay-hero-unity">Unity</span>
            </p>
          </div>

          <div className={`${cardBg} rounded-2xl p-6 shadow-2xl`}>
            <h3 className="text-2xl font-bold mb-4 text-center text-white drop-shadow-lg">
              {isLogin ? trans.login : trans.createAccount}
            </h3>

            <input
              type="text"
              placeholder="Username (3-20 characters)"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setAuthError(""); }}
              className="w-full p-4 border-2 rounded-lg mb-3 text-lg text-gray-900"
            />

            {!isLogin && (
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setAuthError(""); }}
                className="w-full p-4 border-2 rounded-lg mb-3 text-lg text-gray-900"
              />
            )}

            <div className="relative mb-3">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={isLogin ? "Password" : "Password (8+ chars, uppercase, number, special)"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setAuthError(""); }}
                className="w-full p-4 border-2 rounded-lg text-lg text-gray-900"
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>

            {!isLogin && (
              <div className="relative mb-3">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setAuthError(""); }}
                  className="w-full p-4 border-2 rounded-lg text-lg text-gray-900"
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                />
              </div>
            )}

            {!isLogin && password && (
              <div className="mb-3 p-3 bg-gray-100 rounded-lg text-sm">
                <div className="font-bold text-gray-900 mb-2">Password Requirements:</div>
                <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                  {password.length >= 8 ? '✓' : '✗'} At least 8 characters
                </div>
                <div className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-red-600'}`}>
                  {/[A-Z]/.test(password) ? '✓' : '✗'} One uppercase letter
                </div>
                <div className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-red-600'}`}>
                  {/[0-9]/.test(password) ? '✓' : '✗'} One number
                </div>
                <div className={`flex items-center gap-2 ${/[!@#$%^&*]/.test(password) ? 'text-green-600' : 'text-red-600'}`}>
                  {/[!@#$%^&*]/.test(password) ? '✓' : '✗'} One special character
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="mb-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => { setAgreedToTerms(e.target.checked); setAuthError(""); }}
                    className="mt-1 w-5 h-5 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the Terms of Service and Privacy Policy
                  </span>
                </label>
              </div>
            )}

            {authError && (
              <div className="mb-3 text-red-600 font-semibold text-center p-2 bg-red-50 rounded">
                {authError}
              </div>
            )}

            <button
              onClick={handleAuth}
              className="w-full bg-green-600 text-white font-bold py-4 rounded-lg text-lg mb-3 hover:bg-green-700 transition"
            >
              {isLogin ? trans.login : trans.createAccount}
            </button>

            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setPassword("");
                setConfirmPassword("");
                setEmail("");
                setAgreedToTerms(false);
                setAuthError("");
              }} 
              className="w-full text-blue-600 font-semibold hover:underline"
            >
              {isLogin ? "Do not have an account? Sign Up" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== RENDER: ADMIN PANEL ==========
  
  if (ADMIN_PANEL_ENABLED && showAdminPanel && isAdmin) {
    return (
      <div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => setShowModeratorDashboard(false)}
            style={{ fontWeight: !showModeratorDashboard ? 'bold' : 'normal' }}
          >
            Admin Panel
          </button>
          <button
            onClick={() => setShowModeratorDashboard(true)}
            style={{ fontWeight: showModeratorDashboard ? 'bold' : 'normal' }}
          >
            Moderator Dashboard
          </button>
        </div>
        {showModeratorDashboard ? (
          <ModeratorDashboard />
        ) : (
          <AdminPanel
            currentUser={currentUser}
            isAdmin={isAdmin}
            allUsers={allUsers}
            adminUsers={adminUsers}
            userRoles={userRoles}
            adminStats={adminStats}
            adminLogs={adminLogs}
            bannedUsers={bannedUsers}
            setBannedUsers={setBannedUsers}
            shadowBannedUsers={shadowBannedUsers}
            setShadowBannedUsers={setShadowBannedUsers}
            moderators={moderators}
            setModerators={setModerators}
            messages={messages}
            setMessages={setMessages}
            refreshUsers={refreshUsers}
            refreshAdminData={refreshAdminData}
            onClose={() => setShowAdminPanel(false)}
            pushNotif={pushNotif}
          />
        )}
      </div>
    );
  }

  // ========== RENDER: HOME SCREEN ==========
  
  if (screen === "home") {
    return (
      <HomeDashboard
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        language={language}
        setLanguage={(v) => { setLanguageState(v); setLanguage(v); }}
        showPhoneModal={showPhoneModal}
        setShowPhoneModal={setShowPhoneModal}
        notifications={notifications}
        getTotalUnreadCount={getTotalUnreadCount}
        setScreen={setScreen}
        openProfile={openProfile}
        currentUser={currentUser}
        isAdmin={isAdmin}
        ADMIN_PANEL_ENABLED={ADMIN_PANEL_ENABLED}
        pushNotif={pushNotif}
        handleLogout={handleLogout}
        setShowAdminPanel={setShowAdminPanel}
        pendingProfileSteps={pendingProfileSteps}
        profileProgress={profileProgress}
        shouldShowOnboardingCard={shouldShowOnboardingCard}
        setOnboardingModalOpen={setOnboardingModalOpen}
      />
    );
  }

  if (screen === "partnerHub") {
    return (
      <Shell title={`🤝 ${trans.partnerHub}`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <PartnerHub pushNotif={pushNotif} />
      </Shell>
    );
  }

  // ========== RENDER: FEED ==========

  if (screen === "feed") {
    return (
      <Shell title={`📱 ${trans.feed}`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <Feed
          trans={trans}
          postTextRef={postTextRef}
          postText={postText}
          postImage={postImage}
          postImageInputId={postImageInputId}
          handleImageUpload={handleImageUpload}
          handleCreatePost={handleCreatePost}
          posts={posts}
          openProfile={openProfile}
          currentUser={currentUser}
          isAdmin={isAdmin}
          toggleSave={toggleSave}
          handleToggleLike={handleToggleLike}
          handleReaction={handleReaction}
          commentRefs={commentRefs}
          commentTexts={commentTexts}
          handleAddComment={handleAddComment}
          onEditPost={handleEditPost}
          onDeletePost={handleDeletePost}
        />
      </Shell>
    );
  }    
  
  // ========== RENDER: MUSIC ==========
  
  if (screen === "music") {
    return (
      <Shell title={`${trans.music} 🎵`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <Music
          tracks={musicTracks}
          onUpload={handleMusicUpload}
          onToggleSave={(id) => toggleSave(id)}
          onLike={(id) => setMusicTracks((prev) => prev.map((t) => (t.id === id ? { ...t, likes: t.likes + 1 } : t)))}
          onDislike={(id) => setMusicTracks((prev) => prev.map((t) => (t.id === id ? { ...t, dislikes: t.dislikes + 1 } : t)))}
          openProfile={openProfile}
        />
      </Shell>
    );
  }

  // ========== RENDER: HAITI NEWS ==========
  
  if (screen === "haitiNews") {
    return (
      <Shell title={`📰 Haiti News`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Latest News from Haiti</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="font-bold text-lg">Haiti Reconstruction Progress</h3>
              <p className="text-gray-600">Latest updates on infrastructure development and international aid efforts.</p>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="font-bold text-lg">Cultural Festival Announced</h3>
              <p className="text-gray-600">Annual Haitian cultural festival dates and locations revealed.</p>
              <span className="text-sm text-gray-500">1 day ago</span>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="font-bold text-lg">Economic Development Initiatives</h3>
              <p className="text-gray-600">New programs aimed at boosting local entrepreneurship.</p>
              <span className="text-sm text-gray-500">3 days ago</span>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // ========== RENDER: EVENTS ==========
  
  if (screen === "events") {
    return (
      <Shell title={`📅 Community Events`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="font-bold text-lg">Haitian Independence Day Celebration</h3>
              <p className="text-gray-600">Join us for a day of cultural celebration and community gathering.</p>
              <p className="text-blue-600 font-semibold">January 1st • Port-au-Prince</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="font-bold text-lg">Community Health Fair</h3>
              <p className="text-gray-600">Free health screenings and wellness workshops.</p>
              <p className="text-blue-600 font-semibold">February 15th • Cap-Haïtien</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="font-bold text-lg">Youth Leadership Conference</h3>
              <p className="text-gray-600">Empowering the next generation of Haitian leaders.</p>
              <p className="text-blue-600 font-semibold">March 20th • Port-au-Prince</p>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // ========== RENDER: GAMES MENU ==========
  
  if (screen === "games") {
    return (
      <Shell title={`🎮 ${trans.games}`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <GamesMenu onSelectGame={(game) => { setSelectedGame(game); setScreen('game'); }} />
      </Shell>
    );
  }

  // ========== RENDER: GAME SCREEN ==========
  
  if (screen === "game") {
    return (
      <Shell 
        title={selectedGame === "snake" ? "🐍 Snake" : selectedGame === "memory" ? "🧠 Memory" : "⭕ Tic Tac Toe"}
        onBack={() => setScreen("games")}
        bgColor={bgColor}
        textColor={textColor}
      >
        <div className={`${cardBg} rounded-xl p-6 shadow-lg`}>
          {!gameActive ? (
            <div className="text-center">
              <h3 className="text-4xl font-bold text-gray-900 mb-6">Score: {gameScore}</h3>
              <button onClick={startGame} className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-xl text-xl font-bold hover:scale-105 transition">
                START GAME
              </button>
            </div>
          ) : (
            <>
              {selectedGame === "snake" && (
                <SnakeGame 
                  onGameOver={(finalScore) => {
                    setGameScore(finalScore);
                    setGameActive(false);
                    pushNotif(`🐍 Game Over! Score: ${finalScore}`);
                  }} 
                />
              )}

              {selectedGame === "memory" && (
                <MemoryGame 
                  onWin={() => {
                    setGameScore(100);
                    setGameActive(false);
                    pushNotif("🧠 You won Memory Game! +100 points");
                  }}
                />
              )}

              {selectedGame === "tictactoe" && (
                <TicTacToeGame 
                  onGameOver={(winner) => {
                    setGameActive(false);
                    if (winner) {
                      pushNotif(`⭕ ${winner} wins!`);
                    } else {
                      pushNotif("🤝 It's a draw!");
                    }
                  }}
                />
              )}
            </>
          )}
        </div>
      </Shell>
    );
  }

  // ========== RENDER: PUBLIC CHAT ==========
  
  if (screen === "chat") {
    return (
      <Shell title="💬 Public Chat" onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <ChatRoom currentUser={currentUser} isAdmin={isAdmin} />
      </Shell>
    );
  }

  // ========== RENDER: PRIVATE MESSAGES ==========
  
  if (screen === "privateMessages") {
    return (
      <Shell title={`✉️ ${trans.privateMessages}`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <PrivateMessages
          currentUser={currentUser}
          currentChatUser={currentChatUser}
          setCurrentChatUser={setCurrentChatUser}
          otherUsers={otherUsers}
          privateMessages={privateMessages}
          loadingPrivateMessages={loadingPrivateMessages}
          onSendMessage={handleSendPrivateChatMessage}
          onlineUsersSet={onlineUsersSet}
          getUnreadCount={getUnreadCount}
          setScreen={setScreen}
          markMessagesAsRead={markMessagesAsRead}
          openProfile={openProfile}
        />
      </Shell>
    );
  }

  // ========== RENDER: NOTIFICATIONS ==========

  if (screen === "notifications") {
    // Use a lighter card background for notifications to improve contrast in dark mode
    const notifCardBg = darkMode ? 'bg-gray-800/60' : 'bg-white';
    return (
      <Shell title={`🔔 ${trans.notifications}`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <Notifications notifications={notifications} cardBg={notifCardBg} removeNotification={(id) => {
          if (id === 'all') return setNotifications([]);
          removeNotification(id);
        }} />
      </Shell>
    );
  }

  // ========== RENDER: FRIENDS ==========

  if (screen === "friends") {
    return (
      <Shell title={`👥 ${trans.friends}`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <FriendsList
          otherUsers={otherUsers}
          currentUser={currentUser}
          following={following}
          setFollowing={setFollowing}
          openProfile={openProfile}
          setScreen={setScreen}
          setCurrentChatUser={setCurrentChatUser}
          cardBg={cardBg}
        />
      </Shell>
    );
  }

  // ========== RENDER: ALL USERS ==========
  
  if (screen === "allUsers") {
    return (
      <Shell title="👥 All Users" onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <AllUsers
          allUsers={allUsers}
          posts={posts}
          currentUser={currentUser}
          following={following}
          setFollowing={setFollowing}
          openProfile={openProfile}
          setCurrentChatUser={setCurrentChatUser}
          setScreen={setScreen}
          cardBg={cardBg}
        />
      </Shell>
    );
  }

  // ========== RENDER: POLITICS ==========
  
  if (screen === "politics") {
    return (
      <Shell title="🗳️ Haiti Political Opinions" onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <Politics
          politicalOpinions={politicalOpinions}
          handleVoteOpinion={handleVoteOpinion}
          handleCommentOpinion={handleCommentOpinion}
          handleLikeComment={handleLikeComment}
          BLACKLISTED_POLITICIANS={BLACKLISTED_POLITICIANS}
          cardBg={cardBg}
          currentUser={currentUser}
        />
      </Shell>
    );
  }

  // ========== RENDER: MEMORIALS ==========
  
  if (screen === "memorials") {
    return (
      <Shell title="💐 In Memoriam" onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <Memorials
          memorials={memorials}
          memorialPhoto={memorialPhoto}
          memorialNameRef={memorialNameRef}
          memorialYearsRef={memorialYearsRef}
          memorialTributeRef={memorialTributeRef}
          setMemorialPhoto={setMemorialPhoto}
          setMemorialFile={setMemorialFile}
          handleCreateMemorial={handleCreateMemorial}
          handleAddCondolence={handleAddCondolence}
          isAdmin={isAdmin}
          currentUser={currentUser}
          onEditMemorial={handleEditMemorial}
          onDeleteMemorial={handleDeleteMemorial}
        />
      </Shell>
    );
  }

  // ========== RENDER: CLASSMATES ==========
  
  if (screen === "classmates") {
    return (
      <Shell title={`🎓 ${trans.classmates}`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <Classmates
          schools={schools}
          showAddSchool={showAddSchool}
          setShowAddSchool={setShowAddSchool}
          newSchoolName={newSchoolName}
          setNewSchoolName={setNewSchoolName}
          newSchoolCity={newSchoolCity}
          setNewSchoolCity={setNewSchoolCity}
          newSchoolDepartment={newSchoolDepartment}
          setNewSchoolDepartment={setNewSchoolDepartment}
          selectedSchoolId={selectedSchoolId}
          setSelectedSchoolId={setSelectedSchoolId}
          classmateName={classmateName}
          setClassmateName={setClassmateName}
          classmateYear={classmateYear}
          setClassmateYear={setClassmateYear}
          classmateMessage={classmateMessage}
          setClassmateMessage={setClassmateMessage}
          handleAddSchool={handleAddSchool}
          handleCreateClassmatePost={handleCreateClassmatePost}
          classmatesPosts={classmatesPosts}
          replyTexts={replyTexts}
          setReplyTexts={setReplyTexts}
          handleReplyToPost={handleReplyToPost}
        />
      </Shell>
    );
  }

  if (screen === "changePassword") {
    return (
      <Shell
        title="🔒 Change Password"
        onBack={() => setScreen("profile")}
        bgColor={bgColor}
        textColor={textColor}
      >
        <ChangePassword
          currentUser={currentUser}
          onCancel={() => setScreen("profile")}
          onSuccess={() => setScreen("profile")}
          pushNotif={pushNotif}
        />
      </Shell>
    );
  }

  if (screen === "profile") {
    const u = viewProfileUser || currentUser;
    const isMe = u === currentUser;
    const p = profiles[u] || { bio: "", location: "", photos: [] };

    return (
      <Shell title={`👤 ${u}`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <ProfileView
          u={u}
          isMe={isMe}
          p={p}
          editBio={editBio}
          onEditBioChange={(v) => setEditBio(v)}
          editDisplayName={editDisplayName}
          onEditDisplayNameChange={(v) => setEditDisplayName(v)}
          editLocation={editLocation}
          onEditLocationChange={(v) => setEditLocation(v)}
          isUploadingPhotos={isUploadingPhotos}
          handleProfilePhotoUpload={handleProfilePhotoUpload}
          PHOTO_FILTERS={PHOTO_FILTERS}
          aiFiltersEnabled={aiFiltersEnabled}
          selectedFilterStyle={selectedFilterStyle}
          setSelectedFilterStyle={setSelectedFilterStyle}
          MAX_PROFILE_PHOTOS={MAX_PROFILE_PHOTOS}
          FILTER_LABEL_LOOKUP={FILTER_LABEL_LOOKUP}
          pendingDelete={pendingDelete}
          openDeleteModal={openDeleteModal}
          deleteModalOpen={deleteModalOpen}
          closeDeleteModal={closeDeleteModal}
          confirmDelete={confirmDelete}
          deleteLoading={deleteLoading}
          handleSetPrimaryPhoto={handleSetPrimaryPhoto}
          onSaveProfile={() => handleSaveProfile(u)}
          onChangePassword={() => setScreen("changePassword")}
          onMessage={() => { setCurrentChatUser(u); setScreen("privateMessages"); }}

        />

      </Shell>
    );
  }
  
  
  return (
    <Shell title={screen} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
      <div className={`${cardBg} rounded-xl p-8 text-center`}>
        <Star size={48} className="mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">Screen not implemented yet: {screen}</p>
      </div>
    </Shell>
  );
}
