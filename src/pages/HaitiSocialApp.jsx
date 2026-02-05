import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  ArrowLeft, Bell, Bookmark, Camera, MessageSquare,
  Moon, Plus, Search, Send, Shield, Star, Sun,
  ThumbsUp, Users, Volume2, X, Gamepad2
} from "lucide-react";

// Components
import SpinningLogo from '../components/shared/SpinningLogo';
import Shell from '../components/shared/Shell';
import HomeButton from '../components/shared/HomeButton';
import BigButton from '../components/shared/BigButton';
import ChatRoom from '../components/chat/ChatRoom';
import PrivateChat from '../components/chat/PrivateChat';
import PhoneVerification from '../components/auth/PhoneVerification';
import ChangePassword from '../components/auth/ChangePassword';
import AdminPanel from '../components/admin/AdminPanel';
import ModeratorDashboard from '../components/admin/ModeratorDashboard';
import SnakeGame from '../components/games/SnakeGame';
import MemoryGame from '../components/games/MemoryGame';
import TicTacToeGame from '../components/games/TicTacToe';
import PolicyPopup from '../components/PolicyPopup';
import useGoogleTranslate from '../hooks/useGoogleTranslate';
import useChatSocket from '../hooks/useChatSocket';


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
import {
  fetchPosts,
  createPost as createRemotePost,
  toggleLike as toggleRemoteLike,
  reactToPost as reactToRemotePost,
  addComment as addRemoteComment,
} from '../services/feed';
import { PHOTO_FILTERS, MAX_PROFILE_PHOTOS } from '../../shared/photoFilters';

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
const ADMIN_PASSWORD = readEnvValue(['NEXT_PUBLIC_ADMIN_PASSWORD', 'VITE_ADMIN_PASSWORD'], 'admin123') || 'admin123';
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
  const [selectedFilterStyle, setSelectedFilterStyle] = useState(DEFAULT_FILTER_STYLE);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [aiFiltersEnabled, setAiFiltersEnabled] = useState(true); // Removed filter-related state

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
  const [searchQuery, setSearchQuery] = useState("");

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
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);

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
      ? profile.photos
      : Array.isArray(profile.profile?.photos)
        ? profile.profile.photos
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
  
  const pushNotif = useCallback((text) => {
    setNotifications((prev) => [{ id: Date.now(), text }, ...prev]);
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
      setPrivateMessages((prev) => {
        const alreadyExists = prev.some((msg) => msg.id === mapped.id);
        if (alreadyExists) {
          return prev.map((msg) => (msg.id === mapped.id ? { ...msg, ...mapped } : msg));
        }
        return [...prev, mapped];
      });
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
          setPrivateMessages((prev) => [...prev, mapped]);
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
        await uploadProfilePhotos(fileList, { filterStyle: filterToUse });
        await loadProfile(currentUser);
        await refreshUsers();
        const usedAi = filterToUse !== "original";
        pushNotif(usedAi ? "✨ Photo uploaded with AI filter" : "📸 Photo uploaded");
      } catch (err) {
        console.error(err);
        pushNotif(`❌ Failed to upload photo: ${err?.message || "Unknown error"}`);
      } finally {
        setIsUploadingPhotos(false);
      }
    },
    [aiFiltersEnabled, currentUser, loadProfile, refreshUsers, selectedFilterStyle, pushNotif]
  );

  const handleSetPrimaryPhoto = useCallback(
    async (photoId) => {
      if (!currentUser) {
        return;
      }
      try {
        await setPrimaryProfilePhoto(photoId);
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

  const handleDeletePhoto = useCallback(
    async (photoId) => {
      if (!currentUser) {
        return;
      }
      try {
        await deleteProfilePhoto(photoId);
        await loadProfile(currentUser);
        await refreshUsers();
        pushNotif("🗑️ Photo removed");
      } catch (err) {
        console.error(err);
        pushNotif(`❌ Failed to delete photo: ${err?.message || "Unknown error"}`);
      }
    },
    [currentUser, loadProfile, refreshUsers, pushNotif]
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

  const handleDismissOnboarding = useCallback(() => {
    if (!currentUser) {
      setOnboardingModalOpen(false);
      return;
    }
    const key = currentUser.toLowerCase();
    setOnboardingDismissedUsers((prev) => ({
      ...prev,
      [key]: true,
    }));
    setOnboardingModalOpen(false);
  }, [currentUser]);

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

  // Removed filter metadata effect

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
          result = await login({ username: cleanUsername, password: cleanPassword });
        } catch (loginError) {
          const msg = loginError?.message || "Login failed";
          setAuthError(msg);
          pushNotif(`❌ ${msg}`);
          return;
        }
      } else {
        try {
          result = await signup({ 
            username: cleanUsername, 
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

  const handleCreateMemorial = () => {
    const name = memorialNameRef.current?.value || "";
    const tribute = memorialTributeRef.current?.value || "";
    
    if (!name.trim() || !tribute.trim()) {
      pushNotif("⚠️ Please fill in name and tribute");
      return;
    }

    const newPost = {
      lookingFor: classmateName.trim(),
      year: classmateYear.trim(),
      message: classmateMessage.trim(),
      createdAt: Date.now(),
      replies: [],
    };

    setClassmatesPosts(prev => [newPost, ...prev]);
    setClassmateName("");
    setClassmateYear("");
    setClassmateMessage("");
    pushNotif("🎓 Classmate request posted!");
  };

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
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
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
            bannedUsers={bannedUsers}
            setBannedUsers={setBannedUsers}
            shadowBannedUsers={shadowBannedUsers}
            setShadowBannedUsers={setShadowBannedUsers}
            moderators={moderators}
            setModerators={setModerators}
            messages={messages}
            setMessages={setMessages}
            refreshUsers={refreshUsers}
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
      <div className={`min-h-screen ${bgColor} ${textColor}`}>
        <div className="max-w-2xl mx-auto p-4">
          {onboardingModalOpen && shouldShowOnboardingCard && (
            <div className={`${cardBg} rounded-2xl p-5 shadow-xl border border-white/10 mb-6`}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-white/70 font-semibold">Complete your profile</p>
                    <h3 className="text-3xl font-black text-white">{profileProgress.percent}% done</h3>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400"
                        style={{ width: `${profileProgress.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-[1fr_auto] gap-4">
                  <div>
                    {pendingProfileSteps.length === 0 ? (
                      (<p className="text-white/70 text-sm">All steps completed. Great job!</p>)
                    ) : (
                      (<ul className="space-y-2 text-sm text-white/90">
                        {pendingProfileSteps.slice(0, 3).map((step) => (
                          <li key={step.id} className="flex items-center gap-2">
                            <span className="text-yellow-300">•</span>
                            <span>{step.label}</span>
                          </li>
                        ))}
                        {pendingProfileSteps.length > 3 && (
                          <li className="text-xs text-white/60">
                            +{pendingProfileSteps.length - 3} more
                          </li>
                        )}
                      </ul>)
                    )}
                  </div>
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    <button
                      onClick={() => {
                        setOnboardingModalOpen(false);
                        setScreen("profile");
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2.5 rounded-xl"
                    >
                      Finish profile
                    </button>
                    <button
                      onClick={handleDismissOnboarding}
                      className="bg-transparent border border-white/20 text-white/80 hover:text-white font-semibold py-2.5 rounded-xl"
                    >
                      Hide tip
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showPhoneModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <PhoneVerification
                onVerified={(phone) => {
                  setProfiles(prev => ({
                    ...prev,
                    [currentUser]: {
                      ...(prev[currentUser] || {}),
                      phone,
                      phoneVerified: true,
                    }
                  }));
                  setShowPhoneModal(false);
                  pushNotif("✅ Phone verified!");
                }}
                onClose={() => setShowPhoneModal(false)}
              />
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <SpinningLogo />
              <h1 className="text-3xl font-bold logo-glow">Lakay Social</h1>
            </div>
            <div className="flex gap-3 items-center flex-wrap">
              <div 
                onClick={() => setDarkMode(!darkMode)} 
                className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label="Toggle dark mode"
                onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') setDarkMode(!darkMode); }}
              >
          {shouldShowOnboardingCard && (
            <div className={`${cardBg} rounded-2xl p-5 shadow-xl border border-white/10 mb-6`}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-white/70 font-semibold">Complete your profile</p>
                    <h3 className="text-3xl font-black text-white">{profileProgress.percent}% done</h3>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400"
                        style={{ width: `${profileProgress.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-[1fr_auto] gap-4">
                  <div>
                    {pendingProfileSteps.length === 0 ? (
                      <p className="text-white/70 text-sm">All steps completed. Great job!</p>
                    ) : (
                      <ul className="space-y-2 text-sm text-white/90">
                        {pendingProfileSteps.slice(0, 3).map((step) => (
                          <li key={step.id} className="flex items-center gap-2">
                            <span className="text-yellow-300">•</span>
                            <span>{step.label}</span>
                          </li>
                        ))}
                        {pendingProfileSteps.length > 3 && (
                          <li className="text-xs text-white/60">
                            +{pendingProfileSteps.length - 3} more
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    <button
                      onClick={() => {
                        setOnboardingModalOpen(false);
                        setScreen("profile");
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2.5 rounded-xl"
                    >
                      Finish profile
                    </button>
                    <button
                      onClick={handleDismissOnboarding}
                      className="bg-transparent border border-white/20 text-white/80 hover:text-white font-semibold py-2.5 rounded-xl"
                    >
                      Hide tip
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </div>

              <select
                value={language}
                onChange={(e) => {
                  const v = e.target.value;
                  setLanguageState(v);
                  setLanguage(v);
                }}
                className="px-2 py-1 rounded bg-white text-black"
              >
                <option value="en">EN</option>
                <option value="ht">HT</option>
                <option value="fr">FR</option>
                <option value="es">ES</option>
              </select>

              <button 
                onClick={() => setScreen("notifications")} 
                className="relative hover:scale-110 transition"
              >
                <Bell size={24} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {Math.min(notifications.length, 9)}
                  </span>
                )}
              </button>

              <button
                onClick={() => openProfile(currentUser)}
                className="text-sm px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                My Profile
              </button>

              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 font-semibold text-sm"
              >
                {trans.logout}
              </button>
            </div>
          </div>

          {shouldShowOnboardingCard && (
            <div className={`${cardBg} rounded-2xl p-5 shadow-xl border border-white/10 mb-6`}>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm text-white/70 font-semibold">Complete your profile</p>
                    <h3 className="text-3xl font-black text-white">{profileProgress.percent}% done</h3>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400"
                        style={{ width: `${profileProgress.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-[1fr_auto] gap-4">
                  <div>
                    {pendingProfileSteps.length === 0 ? (
                      <p className="text-white/70 text-sm">All steps completed. Great job!</p>
                    ) : (
                      <ul className="space-y-2 text-sm text-white/90">
                        {pendingProfileSteps.slice(0, 3).map((step) => (
                          <li key={step.id} className="flex items-center gap-2">
                            <span className="text-yellow-300">•</span>
                            <span>{step.label}</span>
                          </li>
                        ))}
                        {pendingProfileSteps.length > 3 && (
                          <li className="text-xs text-white/60">
                            +{pendingProfileSteps.length - 3} more
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    <button
                      onClick={() => {
                        setOnboardingModalOpen(false);
                        setScreen("profile");
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2.5 rounded-xl"
                    >
                      Finish profile
                    </button>
                    <button
                      onClick={handleDismissOnboarding}
                      className="bg-transparent border border-white/20 text-white/80 hover:text-white font-semibold py-2.5 rounded-xl"
                    >
                      Hide tip
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Navigation */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <HomeButton icon={<Search size={28} />} label={trans.search} onClick={() => setScreen("search")} color="bg-blue-600" />
            <HomeButton icon={<Star size={28} />} label={trans.saved} onClick={() => setScreen("saved")} color="bg-purple-600" />
            <div className="relative">
              <HomeButton 
                icon={<MessageSquare size={28} />} 
                label={trans.privateMessages} 
                onClick={() => setScreen("privateMessages")} 
                color="bg-teal-600" 
              />
              {getTotalUnreadCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {getTotalUnreadCount()}
                </span>
              )}
            </div>
            <HomeButton icon={<Users size={28} />} label={trans.friends} onClick={() => setScreen("friends")} color="bg-green-600" />
          </div>

          <div className="grid grid-cols-4 gap-3 mb-4">
            <HomeButton icon={<MessageSquare size={28} />} label={trans.feed} onClick={() => setScreen("feed")} color="bg-indigo-600" />
            <HomeButton icon={<MessageSquare size={28} />} label={trans.chat} onClick={() => setScreen("chat")} color="bg-pink-600" />
            <HomeButton icon={<Users size={28} />} label="All Users" onClick={() => setScreen("allUsers")} color="bg-cyan-600" />
            <HomeButton icon={<Users size={28} />} label={trans.classmates} onClick={() => setScreen("classmates")} color="bg-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <BigButton icon={<span className="text-4xl">🗳️</span>} label="Haiti Politics" onClick={() => setScreen("politics")} color="bg-blue-700" />
            <BigButton icon={<span className="text-4xl">💐</span>} label="Memorials" onClick={() => setScreen("memorials")} color="bg-purple-700" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <BigButton icon={<Volume2 size={32} />} label={trans.music} onClick={() => setScreen("music")} color="bg-pink-500" />
            <BigButton icon={<Gamepad2 size={32} />} label={trans.games} onClick={() => setScreen("games")} color="bg-green-500" />
          </div>

          <div className="grid grid-cols-1 gap-4 mb-6">
            <BigButton
              icon={<span className="text-4xl">🤝</span>}
              label={trans.partnerHub}
              onClick={() => setScreen("partnerHub")}
              color="bg-orange-600"
            />
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                if (ADMIN_PANEL_ENABLED) {
                  pushNotif("⏳ Loading admin panel...");
                  setTimeout(() => setShowAdminPanel(true), 100);
                } else {
                  pushNotif("⚠️ Admin dashboard will be available once the backend endpoints are live.");
                }
              }}
              disabled={!ADMIN_PANEL_ENABLED}
              className={`w-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 ${ADMIN_PANEL_ENABLED ? 'hover:scale-105 transition' : 'opacity-60 cursor-not-allowed'}`}
            >
              <Shield size={24} />
              🛡️ ADMIN PANEL
            </button>
          )}
        </div>
      </div>
    );
  }

  if (screen === "partnerHub") {
    const spotlightStats = [
      { label: "Active diaspora members", value: "25k+" },
      { label: "Avg. daily impressions", value: "180k" },
      { label: "Countries represented", value: "32" },
    ];

    const ctaSections = [
      {
        title: "Advertise With Lakay",
        emoji: "📣",
        description:
          "Promote your brand to Haitians at home and abroad with native placements, sponsored stories, and live activations.",
        bullets: [
          "Hero takeovers and in-feed sponsorships",
          "Segmented messaging by diaspora city or Haitian department",
          "Weekly performance recap with actionable next steps",
        ],
        actionLabel: "Request media kit",
        actionLink: "mailto:ads@lakaysocial.com",
        note: "ads@lakaysocial.com",
      },
      {
        title: "Contact Our Team",
        emoji: "💬",
        description:
          "Need support, press materials, or a custom partnership idea? Our core team replies within one business day.",
        bullets: [
          "Chat with a bilingual community manager",
          "Schedule a product demo via Zoom",
          "Get help migrating your existing community",
        ],
        actionLabel: "Book a call",
        actionLink: "https://cal.com/lakay-team/30min",
        note: "hello@lakaysocial.com",
      },
      {
        title: "Join & Collaborate",
        emoji: "🌱",
        description:
          "From non-profits to student leaders, we welcome people who want to build unity across Ayiti and the diaspora.",
        bullets: [
          "Community moderators & ambassadors",
          "University + alumni chapter pilots",
          "Joint hackathons, livestreams, and pop-up labs",
        ],
        actionLabel: "Apply to collaborate",
        actionLink: "mailto:partners@lakaysocial.com",
        note: "partners@lakaysocial.com",
      },
    ];

    const contactTiles = [
      { label: "Media & ads", value: "ads@lakaysocial.com" },
      { label: "Partnerships", value: "partners@lakaysocial.com" },
      { label: "Community care", value: "+1 (786) 555-2034" },
    ];

    return (
      <Shell title={`🤝 ${trans.partnerHub}`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-orange-600 via-pink-600 to-purple-700 rounded-2xl p-6 shadow-2xl border border-white/10">
            <p className="text-white/80 text-sm font-semibold uppercase tracking-wide mb-2">
              Grow with the Lakay network
            </p>
            <h2 className="text-3xl font-black text-white mb-3">
              Advertise, connect, and build with Haitians everywhere
            </h2>
            <p className="text-white/80 text-lg mb-6">
              Pick the path that fits your goal—brand awareness, community engagement, or strategic partnerships.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {spotlightStats.map((stat) => (
                <div key={stat.label} className="bg-white/10 rounded-2xl p-4 text-center border border-white/10">
                  <div className="text-3xl font-black text-white">{stat.value}</div>
                  <p className="text-white/70 text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {ctaSections.map((section) => (
            <section
              key={section.title}
              className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/10 shadow-xl"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="text-4xl mb-3">{section.emoji}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{section.title}</h3>
                  <p className="text-white/70 mb-4 leading-relaxed">{section.description}</p>
                  <ul className="space-y-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 text-white/85">
                        <span className="text-green-400">✔</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="md:w-60 space-y-3">
                  <a
                    href={section.actionLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => pushNotif?.("✉️ We just opened a new conversation")}
                    className="block text-center w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 transition"
                  >
                    {section.actionLabel}
                  </a>
                  <div className="text-white/60 text-sm text-center border border-white/10 rounded-xl py-2 px-3">
                    {section.note}
                  </div>
                </div>
              </div>
            </section>
          ))}

          <div className="bg-black/40 rounded-2xl p-6 border border-white/10">
            <h4 className="text-white text-xl font-semibold mb-4">Quick contacts</h4>
            <div className="grid md:grid-cols-3 gap-4">
              {contactTiles.map((tile) => (
                <div key={tile.label} className="bg-white/5 rounded-xl p-4 border border-white/5 text-white">
                  <p className="text-xs uppercase tracking-wide text-white/50 mb-1">{tile.label}</p>
                  <p className="text-lg font-semibold break-all">{tile.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // ========== RENDER: FEED ==========
  
  if (screen === "feed") {
    return (
      <Shell title={`📱 ${trans.feed}`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
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
              <img src={postImage} alt="Preview" className="w-full max-h-60 object-cover rounded-xl border-4 border-white/50 shadow-lg" />
              <button
                onClick={() => setPostImage(null)}
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
              <p className="text-white text-xl font-bold">No posts yet. Be the first to share!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-2xl p-6 shadow-2xl border-4 border-white/50">
                {/* Post Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold cursor-pointer border-4 border-white shadow-lg text-xl"
                    onClick={() => openProfile(post.user)}
                  >
                    {post.user[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div
                      className="font-bold text-white text-lg cursor-pointer hover:underline"
                      onClick={() => openProfile(post.user)}
                    >
                      {post.user}
                    </div>
                    <div className="text-sm text-white/80">
                      {new Date(post.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <button onClick={() => toggleSave(`post:${post.id}`)} className="text-white hover:scale-110 transition">
                    <Bookmark size={24} />
                  </button>
                </div>

                {/* Post Content */}
                <p className="text-white text-lg font-semibold mb-4 bg-black/20 rounded-xl p-4">{post.content}</p>

                {/* Post Image */}
                {post.image && (
                  <img src={post.image} alt="Post" className="w-full max-h-96 object-cover rounded-xl mb-4 border-4 border-white shadow-lg" />
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
                      <div
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold cursor-pointer flex-shrink-0 border-2 border-white"
                        onClick={() => openProfile(comment.user)}
                      >
                        {comment.user[0].toUpperCase()}
                      </div>
                      <div className="flex-1 bg-white rounded-xl p-3 shadow-lg">
                        <div
                          className="font-bold text-sm cursor-pointer hover:text-blue-600"
                          onClick={() => openProfile(comment.user)}
                        >
                          {comment.user}
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
      </Shell>
    );
  }    
  
  // ========== RENDER: MUSIC ==========
  
  if (screen === "music") {
    return (
      <Shell title={`${trans.music} 🎵`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <div className="flex justify-end mb-4">
          <button onClick={handleMusicUpload} className="bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-pink-700">
            <Plus size={20} /> Upload Music
          </button>
        </div>

        {musicTracks.map((track) => (
          <div key={track.id} className={`${cardBg} rounded-xl p-4 mb-4 shadow-lg`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-3xl">🎵</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">{track.title}</h3>
                <p 
                  className="text-sm text-blue-600 cursor-pointer hover:underline"
                  onClick={() => openProfile(track.artist)}
                >
                  by {track.artist}
                </p>
              </div>
              <button onClick={() => toggleSave(`music:${track.id}`)} title="Save">
                <Bookmark className="text-gray-600 hover:text-black" />
              </button>
            </div>

            {track.audioUrl && (
              <div className="mb-3">
                <audio controls className="w-full">
                  <source src={track.audioUrl} type="audio/mpeg" />
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setMusicTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, likes: t.likes + 1 } : t)))}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600"
              >
                <ThumbsUp size={18} /> {track.likes}
              </button>
              <button
                onClick={() => setMusicTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, dislikes: t.dislikes + 1 } : t)))}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-600"
              >
                <ThumbsUp size={18} className="rotate-180" /> {track.dislikes}
              </button>
            </div>
          </div>
        ))}
      </Shell>
    );
  }

  // ========== RENDER: GAMES MENU ==========
  
  if (screen === "games") {
    return (
      <Shell title={`🎮 ${trans.games}`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <div className="grid grid-cols-2 gap-4">
          {["snake", "memory", "tictactoe"].map((game) => (
            <button
              key={game}
              onClick={() => {
                setSelectedGame(game);
                setScreen("game");
              }}
              className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl p-8 shadow-lg hover:scale-105 transition"
            >
              <div className="text-6xl mb-3">
                {game === "snake" ? "🐍" : game === "memory" ? "🧠" : "⭕"}
              </div>
              <div className="font-bold text-lg">
                {game === "snake" ? "Snake" : game === "memory" ? "Memory" : "Tic Tac Toe"}
              </div>
            </button>
          ))}
        </div>
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
        {!currentChatUser ? (
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Select user to message:</h3>
            {otherUsers.length === 0 ? (
              <div className={`${cardBg} rounded-xl p-4 shadow text-center text-gray-200`}>
                No other users are online yet. Create accounts from the admin panel or invite friends to start chatting.
              </div>
            ) : (
              otherUsers.map((user) => {
                const unreadCount = getUnreadCount(user);
                const isOnline = onlineUsersSet.has(user.toLowerCase());
                return (
                  <button
                    key={user}
                    onClick={() => {
                      setCurrentChatUser(user);
                      markMessagesAsRead(user);
                    }}
                    className={`w-full ${cardBg} p-4 rounded-xl mb-3 shadow flex items-center gap-3 hover:scale-105 transition relative`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {user[0]}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-gray-900">{user}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <span>Send private message</span>
                        {isOnline && <span className="inline-flex items-center text-green-600 text-xs font-semibold">● Online</span>}
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                    <MessageSquare className="text-gray-400" />
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div>
            <button onClick={() => setCurrentChatUser(null)} className="mb-4 text-white flex items-center gap-2 hover:underline">
              <ArrowLeft size={16} /> Back to contacts
            </button>

            <PrivateChat
              currentUser={currentUser}
              otherUser={currentChatUser}
              privateMessages={privateMessages}
              bannedWords={[]}
              isLoading={loadingPrivateMessages}
              onSendMessage={(message) => handleSendPrivateChatMessage(currentChatUser, message)}
            />
          </div>
        )}
      </Shell>
    );
  }

  // ========== RENDER: NOTIFICATIONS ==========

  if (screen === "notifications") {
    return (
      <Shell title={`🔔 ${trans.notifications}`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <div className={`${cardBg} rounded-xl p-4 shadow mb-4 flex items-center justify-between`}>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Recent Notifications</h3>
            <p className="text-sm text-gray-600">Stay up to date with everything happening on Lakay.</p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={() => setNotifications([])}
              className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
            >
              Clear All
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className={`${cardBg} rounded-xl p-8 text-center shadow`}> 
            <Bell size={48} className="mx-auto mb-4 text-gray-500" />
            <p className="text-gray-600 font-semibold">No notifications yet. We'll let you know when something happens!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div key={notif.id} className={`${cardBg} rounded-xl p-4 shadow flex items-start gap-3`}>
                <Bell size={20} className="text-yellow-500 mt-1" />
                <div>
                  <p className="text-gray-900 font-semibold">{notif.text}</p>
                  <p className="text-xs text-gray-500">{new Date(notif.id).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Shell>
    );
  }

  // ========== RENDER: FRIENDS ==========

  if (screen === "friends") {
    return (
      <Shell title={`👥 ${trans.friends}`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <div>
          {otherUsers.length === 0 ? (
            <div className={`${cardBg} rounded-xl p-6 text-center text-gray-200`}>
              No friends to show yet. Invite new users or create them from the admin panel to build your community.
            </div>
          ) : (
            otherUsers.map((user) => (
              <div key={user} className={`${cardBg} rounded-xl p-4 mb-3 shadow flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {user[0].toUpperCase()}
                  </div>
                  <div className="font-bold text-gray-900 text-lg">{user}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openProfile(user)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                  >
                    View
                  </button>
                  {user !== currentUser && (
                    <button
                      onClick={() => setFollowing((prev) => ({ ...prev, [user]: !prev[user] }))}
                      className={`px-6 py-2 rounded-lg font-bold transition ${
                        following[user]
                          ? "bg-gray-300 text-gray-900"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      {following[user] ? "✓ Following" : "Follow"}
                    </button>
                  )}
                  {user !== currentUser && (
                    <button
                      onClick={() => {
                        setCurrentChatUser(user);
                        setScreen("privateMessages");
                      }}
                      className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-sm font-semibold"
                    >
                      Message
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Shell>
    );
  }

  // ========== RENDER: ALL USERS ==========
  
  if (screen === "allUsers") {
    return (
      <Shell title="👥 All Users" onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <div className="grid grid-cols-1 gap-3">
          {allUsers.length === 0 ? (
            <div className={`${cardBg} rounded-xl p-6 text-center text-gray-200`}>
              No accounts found yet. Use the admin panel to seed demo users or share the signup link.
            </div>
          ) : (
            allUsers.map((user) => (
              <div key={user} className={`${cardBg} rounded-xl p-4 shadow-lg flex items-center gap-4`}>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user[0].toUpperCase()}
                </div>

                <div className="flex-1">
                  <div className="font-bold text-lg text-gray-900">{user}</div>
                  <div className="text-xs text-gray-600">
                    {posts.filter((p) => p.user === user).length} posts
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => openProfile(user)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold"
                  >
                    View Profile
                  </button>
                  {user !== currentUser && (
                    <button
                      onClick={() => setFollowing((prev) => ({ ...prev, [user]: !prev[user] }))}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        following[user]
                          ? "bg-gray-300 text-gray-900"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      {following[user] ? "✓ Following" : "Follow"}
                    </button>
                  )}
                  {user !== currentUser && (
                    <button
                      onClick={() => {
                        setCurrentChatUser(user);
                        setScreen("privateMessages");
                      }}
                      className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-sm font-semibold"
                    >
                      Message
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Shell>
    );
  }

  // ========== RENDER: POLITICS ==========
  
  if (screen === "politics") {
    return (
      <Shell title="🗳️ Haiti Political Opinions" onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <div className="bg-gradient-to-r from-blue-600 to-red-600 text-white rounded-xl p-6 mb-4 shadow-lg">
          <h2 className="text-2xl font-bold mb-2">🇭🇹 Voice Your Opinion</h2>
          <p className="text-sm">Share your views on Haiti's political future. Your vote counts!</p>
        </div>

        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-red-900 mb-2">❌ Politicians Who Should Not Run Again</h3>
          <p className="text-sm text-red-800 mb-2">Based on 10+ years in office or failed leadership:</p>
          <div className="grid grid-cols-2 gap-2">
            {BLACKLISTED_POLITICIANS.map(name => (
              <div key={name} className="bg-white p-2 rounded text-sm text-gray-900">
                🚫 {name}
              </div>
            ))}
          </div>
        </div>

        {politicalOpinions.map(opinion => {
          const total = opinion.agree + opinion.disagree + opinion.neutral;
          const agreePercent = total > 0 ? Math.round((opinion.agree / total) * 100) : 0;
          const disagreePercent = total > 0 ? Math.round((opinion.disagree / total) * 100) : 0;
          const neutralPercent = total > 0 ? Math.round((opinion.neutral / total) * 100) : 0;
          const userVote = opinion.userVotes[currentUser];

          return (
            <div key={opinion.id} className={`${cardBg} rounded-xl p-6 mb-6 shadow-lg border-2 ${userVote ? 'border-blue-500' : 'border-transparent'}`}>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{opinion.question}</h3>
              <p className="text-sm text-gray-700 mb-4">{opinion.description}</p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => handleVoteOpinion(opinion.id, 'agree')}
                  className={`py-3 rounded-lg font-bold transition ${
                    userVote === 'agree' ? 'bg-green-700 text-white ring-4 ring-green-300' : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  ✅ Agree
                  <div className="text-2xl">{opinion.agree}</div>
                </button>
                <button
                  onClick={() => handleVoteOpinion(opinion.id, 'neutral')}
                  className={`py-3 rounded-lg font-bold transition ${
                    userVote === 'neutral' ? 'bg-gray-600 text-white ring-4 ring-gray-300' : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                >
                  ⚪ Neutral
                  <div className="text-2xl">{opinion.neutral}</div>
                </button>
                <button
                  onClick={() => handleVoteOpinion(opinion.id, 'disagree')}
                  className={`py-3 rounded-lg font-bold transition ${
                    userVote === 'disagree' ? 'bg-red-700 text-white ring-4 ring-red-300' : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  ❌ Disagree
                  <div className="text-2xl">{opinion.disagree}</div>
                </button>
              </div>

              <div className="h-8 bg-gray-200 rounded-full overflow-hidden flex">
                <div className="bg-green-600 transition-all duration-1000" style={{ width: `${agreePercent}%` }} />
                <div className="bg-gray-500 transition-all duration-1000" style={{ width: `${neutralPercent}%` }} />
                <div className="bg-red-600 transition-all duration-1000" style={{ width: `${disagreePercent}%` }} />
              </div>

              <div className="border-t-2 pt-4 mt-4">
                <h4 className="font-bold text-gray-900 mb-3">💬 Comments ({opinion.comments.length})</h4>
                
                <div className="flex gap-2 mb-3">
                  <input
                    id={`comment-input-${opinion.id}`}
                    placeholder="Share your thoughts..."
                    className="flex-1 p-3 border-2 rounded-lg text-black"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        handleCommentOpinion(opinion.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById(`comment-input-${opinion.id}`);
                      if (input.value.trim()) {
                        handleCommentOpinion(opinion.id, input.value);
                        input.value = '';
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700"
                  >
                    Post
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {opinion.comments.map(comment => (
                    <div key={comment.id} className="bg-white border-l-4 border-blue-600 p-3 rounded-r-lg shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-blue-800">{comment.user}</span>
                        <button onClick={() => handleLikeComment(opinion.id, comment.id)} className="flex items-center gap-1">
                          <span className="text-red-500">❤️</span>
                          <span className="text-xs font-bold text-gray-700">{comment.likes || 0}</span>
                        </button>
                      </div>
                      <div className="text-sm text-gray-900 mt-1">{comment.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </Shell>
    );
  }

  // ========== RENDER: MEMORIALS ==========
  
  if (screen === "memorials") {
    return (
      <Shell title="💐 In Memoriam" onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 mb-4 shadow-lg">
          <h2 className="text-2xl font-bold mb-2">💐 Honor Their Memory</h2>
          <p className="text-sm">Create tributes for loved ones who have passed away.</p>
        </div>

        <div className={`${cardBg} rounded-xl p-6 mb-6 shadow-lg`}>
          <h3 className="text-xl font-bold text-gray-900 mb-4">Create Memorial</h3>
          
          <input
            placeholder="Person's Full Name"
            ref={memorialNameRef}
            className="w-full p-3 border-2 rounded-lg mb-3 text-gray-900"
          />
          
          <input
            placeholder="Years (e.g., 1950-2023)"
            ref={memorialYearsRef}
            className="w-full p-3 border-2 rounded-lg mb-3 text-gray-900"
          />
          
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Upload Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setMemorialPhoto(reader.result);
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full p-2 border-2 rounded-lg"
            />
          </div>

          {memorialPhoto && (
            <div className="mb-3">
              <img src={memorialPhoto} alt="Preview" className="w-32 h-32 rounded-lg object-cover" />
            </div>
          )}
          
          <textarea
            placeholder="Write a tribute..."
            ref={memorialTributeRef}
            className="w-full p-3 border-2 rounded-lg mb-3 text-gray-900"
            rows={6}
          />
          
          <button
            onClick={handleCreateMemorial}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700"
          >
            Create Memorial
          </button>
        </div>

        {memorials.map(memorial => (
          <div key={memorial.id} className={`${cardBg} rounded-xl p-6 mb-6 shadow-lg`}>
            <div className="flex gap-4 mb-4">
              {memorial.photo ? (
                <img src={memorial.photo} alt={memorial.name} className="w-24 h-24 rounded-full object-cover border-4 border-purple-500" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl">💐</div>
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">{memorial.name}</h3>
                <p className="text-lg text-gray-600">{memorial.years}</p>
                <p className="text-sm text-gray-500">Posted by {memorial.author}</p>
              </div>
            </div>

            <p className="text-gray-800 whitespace-pre-wrap mb-4">{memorial.tribute}</p>

            <div className="border-t-2 pt-4">
              <h4 className="font-bold text-gray-900 mb-3">💬 Condolences ({memorial.condolences.length})</h4>
              
              <div className="flex gap-2 mb-3">
                <input
                  placeholder="Leave your condolences..."
                  className="flex-1 p-3 border-2 rounded-lg text-gray-900"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      handleAddCondolence(memorial.id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {memorial.condolences.map(cond => (
                  <div key={cond.id} className="bg-purple-50 p-3 rounded-lg">
                    <div className="font-bold text-sm text-purple-700">{cond.author}</div>
                    <div className="text-sm text-gray-800">{cond.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </Shell>
    );
  }

  // ========== RENDER: CLASSMATES ==========
  
  if (screen === "classmates") {
    return (
      <Shell title={`🎓 ${trans.classmates}`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <div className={`${cardBg} rounded-xl p-4 shadow-lg mb-4`}>
          <h3 className="font-bold text-gray-900 text-lg mb-2">Find old classmates</h3>
          <p className="text-sm text-gray-700">Choose your school, post a request, and let people reply.</p>
        </div>

        {/* Add School Modal */}
        {showAddSchool && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${cardBg} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
              <h3 className="text-xl font-bold text-gray-900 mb-4">➕ Add New School</h3>
              
              <input
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                className="w-full p-3 rounded-lg border-2 text-gray-900 mb-3"
                placeholder="School Name (e.g., Lycée Toussaint Louverture)"
              />
              
              <input
                value={newSchoolCity}
                onChange={(e) => setNewSchoolCity(e.target.value)}
                className="w-full p-3 rounded-lg border-2 text-gray-900 mb-3"
                placeholder="City (e.g., Port-au-Prince)"
              />
              
              <select
                value={newSchoolDepartment}
                onChange={(e) => setNewSchoolDepartment(e.target.value)}
                className="w-full p-3 rounded-lg border-2 text-gray-900 mb-4"
              >
                <option value="">Select Department</option>
                <option value="Artibonite">Artibonite</option>
                <option value="Centre">Centre</option>
                <option value="Grand'Anse">Grand'Anse</option>
                <option value="Nippes">Nippes</option>
                <option value="Nord">Nord</option>
                <option value="Nord-Est">Nord-Est</option>
                <option value="Nord-Ouest">Nord-Ouest</option>
                <option value="Ouest">Ouest</option>
                <option value="Sud">Sud</option>
                <option value="Sud-Est">Sud-Est</option>
              </select>

              <div className="flex gap-2">
                <button
                  onClick={handleAddSchool}
                  className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700"
                >
                  Add School
                </button>
                <button
                  onClick={() => {
                    setShowAddSchool(false);
                    setNewSchoolName("");
                    setNewSchoolCity("");
                    setNewSchoolDepartment("");
                  }}
                  className="flex-1 bg-gray-500 text-white font-bold py-3 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`${cardBg} rounded-xl p-4 shadow mb-4`}>
          <div className="flex justify-between items-center mb-2">
            <div className="font-bold text-gray-900">Choose a school</div>
            <button
              onClick={() => setShowAddSchool(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm flex items-center gap-2"
            >
              ➕ Add School
            </button>
          </div>
          
          <div className="max-h-48 overflow-y-auto space-y-2">
            {schools.map((s) => (
              <button 
                key={s.id} 
                onClick={() => setSelectedSchoolId(s.id)} 
                className={`w-full p-3 rounded-lg border-2 text-left transition ${
                  selectedSchoolId === s.id 
                    ? "border-blue-600 bg-blue-50 shadow-md" 
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}
              >
                <div className="font-bold text-gray-900">{s.name}</div>
                <div className="text-sm text-gray-600">{s.city} • {s.department}</div>
              </button>
            ))}
          </div>
        </div>

        <div className={`${cardBg} rounded-xl p-4 shadow mb-4`}>
          <div className="font-bold text-gray-900 mb-2">Post a classmate request</div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <input 
              value={classmateName}
              onChange={(e) => setClassmateName(e.target.value)}
              className="p-3 rounded-lg border-2 text-gray-900" 
              placeholder="Classmate name (required)" 
            />
            <input 
              value={classmateYear}
              onChange={(e) => setClassmateYear(e.target.value)}
              className="p-3 rounded-lg border-2 text-gray-900" 
              placeholder="Year (e.g., 2012)" 
            />
            <button 
              onClick={handleCreateClassmatePost} 
              className="bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
            >
              Post
            </button>
          </div>

          <textarea 
            value={classmateMessage}
            onChange={(e) => setClassmateMessage(e.target.value)}
            className="w-full p-3 rounded-lg border-2 text-gray-900" 
            rows={3} 
            placeholder="Message (optional)" 
          />
        </div>

        <div className={`${cardBg} rounded-xl p-4 shadow`}>
          <div className="font-bold text-gray-900 text-lg mb-3">Requests ({classmatesPosts.length})</div>

          {classmatesPosts.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No requests yet. Be the first to post!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {classmatesPosts.map((p) => (
                <div key={p.id} className="border-2 border-gray-200 rounded-xl p-4">
                  <div className="font-bold text-gray-900">{p.lookingFor}</div>
                  <div className="text-sm text-gray-600">School: {p.schoolName}{p.year ? ` • Year: ${p.year}` : ""}</div>
                  <div className="text-sm text-gray-600">Posted by {p.postedBy}</div>
                  
                  {p.message && <div className="mt-3 text-gray-900">{p.message}</div>}

                  <div className="mt-4">
                    <div className="text-sm font-bold text-gray-900 mb-2">Replies ({p.replies.length})</div>

                    {p.replies.length === 0 ? (
                      <div className="text-sm text-gray-500">No replies yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {p.replies.map((r) => (
                          <div key={r.id} className="bg-gray-100 rounded-lg p-3">
                            <div className="text-sm font-bold text-gray-900">{r.by}</div>
                            <div className="text-sm text-gray-800">{r.text}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <input
                        value={replyTexts[p.id] || ""}
                        onChange={(e) => setReplyTexts(prev => ({ ...prev, [p.id]: e.target.value }))}
                        className="flex-1 p-3 rounded-lg border-2 text-gray-900"
                        placeholder="Write a reply..."
                        onKeyDown={(e) => e.key === "Enter" && handleReplyToPost(p.id)}
                      />
                      <button 
                        onClick={() => handleReplyToPost(p.id)} 
                        className="px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
    const p = profiles[u] && typeof profiles[u] === 'object' ? profiles[u] : { username: u, displayName: u, bio: "", location: "", photoDataUrl: "", photos: [] };
    // Defensive: fallback for any property
    const displayName = p?.displayName || u;
    const bio = p?.bio || "";
    const location = p?.location || "";
    const photoDataUrl = p?.photoDataUrl || "";
    const photos = Array.isArray(p?.photos) ? p.photos : [];
    const isMe = u === currentUser;

    return (
      <Shell title={`👤 ${u}`} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
        <div className={`${cardBg} rounded-xl p-5 shadow`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-3xl">
              {p.photoDataUrl ? (
                <img src={p.photoDataUrl} alt="profile" className="w-full h-full object-cover" />
              ) : (
                "👤"
              )}
            </div>

            <div className="flex-1">
              <div className="text-xl font-bold text-gray-900">{p.displayName || u}</div>
              <div className="text-sm text-gray-600">@{u}</div>
              <div className="text-sm text-gray-600 mt-1">{p.location || "No location set"}</div>
            </div>
          </div>

          {isMe && (
            <div className="mt-6">
                {/* Removed AI Photo Filters UI */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="font-bold text-gray-900">AI Photo Filters</div>
                <div className="text-sm text-gray-600">{(p.photos?.length || 0)} / {MAX_PROFILE_PHOTOS} photos</div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {PHOTO_FILTERS.map((filter) => {
                  const disabled = !aiFiltersEnabled && filter.id !== "original";
                  const isSelected = selectedFilterStyle === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedFilterStyle(filter.id)}
                      className={`text-left rounded-xl border p-3 transition ${isSelected ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-400"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
                        <span>{filter.label}</span>
                        <span className={`text-xs ${filter.id === "original" ? "text-gray-500" : "text-purple-600"}`}>
                          {filter.id === "original" ? "No AI" : "AI"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{filter.description}</p>
                    </button>
                  );
                })}
              </div>

              {!aiFiltersEnabled && (
                <p className="text-xs text-amber-600 mt-2">
                  AI filters are temporarily unavailable. Uploads will use the original photo.
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label
                  className={`px-4 py-2 rounded-lg font-semibold text-white cursor-pointer ${isUploadingPhotos ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {isUploadingPhotos ? "Uploading..." : "Upload Photos"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={isUploadingPhotos}
                    onChange={(e) => handleProfilePhotoUpload(e.target.files)}
                  />
                </label>
                <div className="text-sm text-gray-600">
                  Supports JPG, PNG, WEBP. Maximum {MAX_PROFILE_PHOTOS} photos.
                </div>
                <div className="text-xs text-gray-500">
                  Tip: Hold Ctrl (or Command on Mac) to select multiple photos at once.
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <div className="font-bold text-gray-900 mb-2">Bio</div>
            {isMe ? (
              <textarea
                className="w-full p-3 rounded-lg border-2 text-gray-900"
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell people about you..."
              />
            ) : (
              <div className="text-gray-800 bg-gray-100 p-3 rounded-lg">{p.bio || "No bio yet."}</div>
            )}
          </div>

          <div className="mt-6">
            <div className="font-bold text-gray-900 mb-2">Photo Gallery</div>
            {p.photos?.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {p.photos.map((photo) => (
                  <div key={photo.id} className="rounded-xl border border-gray-200 p-3">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={photo.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-700">
                      <span>{FILTER_LABEL_LOOKUP[photo.filter_style] || "Original"}</span>
                      {photo.is_primary && <span className="text-green-600 font-semibold">Primary</span>}
                    </div>
                    {isMe && (
                      <div className="flex gap-2 mt-3">
                        {!photo.is_primary && (
                          <button
                            onClick={() => handleSetPrimaryPhoto(photo.id)}
                            className="flex-1 rounded-lg border border-blue-600 text-blue-600 px-3 py-1 text-sm hover:bg-blue-50"
                          >
                            Make Primary
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="flex-1 rounded-lg border border-red-500 text-red-500 px-3 py-1 text-sm hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600 bg-gray-100 rounded-lg p-4">No photos yet.</div>
            )}
          </div>

          {isMe && (
            <>
              <div className="mt-4">
                <div className="font-bold text-gray-900 mb-2">Display Name</div>
                <input
                  className="w-full p-3 rounded-lg border-2 text-gray-900"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>
              <div className="mt-4">
                <div className="font-bold text-gray-900 mb-2">Location</div>
                <input
                  className="w-full p-3 rounded-lg border-2 text-gray-900"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="City / Country"
                />
              </div>
              <button
                onClick={async () => {
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
                      [u]: { ...p, displayName: editDisplayName, bio: editBio, location: editLocation },
                    }));
                    await loadProfile(currentUser);
                    await refreshUsers();
                    pushNotif("✅ Profile updated!");
                    setTimeout(() => setScreen("home"), 1000);
                  } catch (err) {
                    pushNotif(`❌ Failed to update profile: ${err?.message || "Unknown error"}`);
                  }
                }}
                className="mt-4 w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700"
              >
                Save Profile
              </button>

              <button
                onClick={() => setScreen("changePassword")}
                className="mt-3 w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700"
              >
                Change Password
              </button>
            </>
          )}

          {!isMe && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setCurrentChatUser(u);
                  setScreen("privateMessages");
                }}
                className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700"
              >
                Send Message
              </button>
            </div>
          )}
        </div>
      </Shell>
    );
  }
{/* User Stats */}
          
  // ========== DEFAULT FALLBACK ==========
  
  return (
    <Shell title={screen} onBack={() => setScreen("home")} bgColor={bgColor} textColor={textColor}>
      <div className={`${cardBg} rounded-xl p-8 text-center`}>
        <Star size={48} className="mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">Screen not implemented yet: {screen}</p>
      </div>
    </Shell>
  );
}
