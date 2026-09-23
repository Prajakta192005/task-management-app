"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  completeTask,
  createTask,
  getCurrentUser,
  getUsers,
  loginWithGoogle,
  logout,
} from "@/lib/api";

type User = {
  id: number;
  name: string;
  email: string;
  profile_picture: string | null;
};

type Task = {
  id: number;
  title: string;
  description: string | null;
  created_by: number;
  assigned_to: number;
  status: "pending" | "completed";
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
};

type ActiveSection =
  | "dashboard"
  | "tasks"
  | "calendar"
  | "team"
  | "settings";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "pending" | "completed"
  >("all");
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [activeSection, setActiveSection] =
    useState<ActiveSection>("dashboard");

  async function loadDashboard() {
    try {
      const userData = await getCurrentUser();

      if (userData.status !== "success") {
        setUser(null);
        return;
      }

      setUser(userData.user);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      const taskResponse = await fetch(`${apiUrl}/api/tasks`, {
        method: "GET",
        credentials: "include",
      });

      const taskData = await taskResponse.json();

      if (taskData.status === "success") {
        setTasks(taskData.tasks);
      }
    } catch (error) {
      console.error("Dashboard loading failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleLogout() {
    setLogoutLoading(true);

    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      setLogoutLoading(false);
    }
  }

  async function handleCompleteTask(taskId: number) {
    try {
      const data = await completeTask(taskId);

      if (data.status === "success") {
        setTasks((currentTasks) =>
          currentTasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: "completed",
                  completed_at: data.task.completed_at,
                }
              : task
          )
        );
      } else {
        console.error(
          "Task completion failed:",
          data.message
        );
      }
    } catch (error) {
      console.error("Task completion failed:", error);
    }
  }

  function handleNavigation(section: ActiveSection) {
    setActiveSection(section);
    setSidebarOpen(false);
    setProfileOpen(false);
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (task.description || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        activeFilter === "all" ||
        task.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [tasks, search, activeFilter]);

  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status === "pending"
  ).length;

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  const pageTitle =
    activeSection === "dashboard"
      ? "Dashboard"
      : activeSection === "tasks"
      ? "My Tasks"
      : activeSection === "calendar"
      ? "Calendar"
      : activeSection === "team"
      ? "Team"
      : "Settings";

  const pageSubtitle =
    activeSection === "dashboard"
      ? `Welcome back, ${user.name.split(" ")[0]} 👋`
      : activeSection === "tasks"
      ? "Tasks assigned to you"
      : activeSection === "calendar"
      ? "Keep track of your deadlines"
      : activeSection === "team"
      ? "People working in your workspace"
      : "Manage your account";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-800 bg-slate-900 transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
                <ClipboardList size={21} />
              </div>

              <div>
                <h1 className="font-bold tracking-tight">
                  TaskFlow
                </h1>

                <p className="text-xs text-slate-500">
                  Work smarter
                </p>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-500 hover:text-white lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4">
            <SidebarItem
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
              active={activeSection === "dashboard"}
              onClick={() =>
                handleNavigation("dashboard")
              }
            />

            <SidebarItem
              icon={<ClipboardList size={18} />}
              label="My Tasks"
              active={activeSection === "tasks"}
              onClick={() =>
                handleNavigation("tasks")
              }
            />

            <SidebarItem
              icon={<CalendarDays size={18} />}
              label="Calendar"
              active={activeSection === "calendar"}
              onClick={() =>
                handleNavigation("calendar")
              }
            />

            <SidebarItem
              icon={<Users size={18} />}
              label="Team"
              active={activeSection === "team"}
              onClick={() =>
                handleNavigation("team")
              }
            />

            <SidebarItem
              icon={<Settings size={18} />}
              label="Settings"
              active={activeSection === "settings"}
              onClick={() =>
                handleNavigation("settings")
              }
            />
          </nav>

          {/* User section */}
          <div className="border-t border-slate-800 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-3">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600">
                  <UserRound size={18} />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user.name}
                </p>

                <p className="truncate text-xs text-slate-500">
                  {user.email}
                </p>
              </div>

              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="text-slate-500 transition hover:text-white disabled:opacity-50"
                title="Logout"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="lg:ml-72">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-slate-400 hover:text-white lg:hidden"
              >
                <Menu size={23} />
              </button>

              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  {pageTitle}
                </h2>

                <p className="hidden text-sm text-slate-500 sm:block">
                  {pageSubtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              {(activeSection === "dashboard" ||
                activeSection === "tasks") && (
                <div className="relative hidden md:block">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search tasks..."
                    className="w-56 rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Notifications */}
              <button
                className="relative rounded-xl border border-slate-800 p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                title="Notifications"
              >
                <Bell size={18} />

                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-500" />
              </button>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() =>
                    setProfileOpen((value) => !value)
                  }
                  className="flex items-center gap-2 rounded-xl border border-slate-800 p-1.5 pr-2.5 transition hover:bg-slate-800"
                >
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.name}
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                      <UserRound size={16} />
                    </div>
                  )}

                  <ChevronDown
                    size={15}
                    className="hidden text-slate-500 sm:block"
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl">
                    <div className="border-b border-slate-800 px-3 py-3">
                      <p className="truncate text-sm font-medium">
                        {user.name}
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {user.email}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setActiveSection("settings");
                      }}
                      className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      <Settings size={16} />
                      Settings
                    </button>

                    <button
                      onClick={handleLogout}
                      disabled={logoutLoading}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>

              {/* New task */}
              <button
                onClick={() => setShowCreateTask(true)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium shadow-lg shadow-indigo-600/10 transition hover:bg-indigo-500"
              >
                <Plus size={18} />

                <span className="hidden sm:inline">
                  New Task
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-5 sm:p-8">
          {/* Dashboard */}
          {activeSection === "dashboard" && (
            <>
              {/* Hero */}
              <section className="relative mb-8 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-600/20 via-slate-900 to-slate-900 p-6 sm:p-8">
                <div className="relative z-10">
                  <p className="text-xs font-semibold tracking-[0.2em] text-indigo-400">
                    YOUR WORKSPACE
                  </p>

                  <h2 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
                    Stay organized. Get things done.
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                    Track assignments, manage deadlines
                    and collaborate with your team from one
                    simple workspace.
                  </p>

                  <button
                    onClick={() =>
                      setShowCreateTask(true)
                    }
                    className="mt-6 flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    <Plus size={17} />
                    Create a task
                  </button>
                </div>

                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-600/10 blur-3xl" />
                <div className="absolute -bottom-20 right-20 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl" />
              </section>

              {/* Stats */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Total Tasks"
                  value={tasks.length}
                  icon={<ClipboardList size={21} />}
                  description="All tasks in your workspace"
                />

                <StatCard
                  title="Pending"
                  value={pendingTasks}
                  icon={<Clock3 size={21} />}
                  description="Tasks waiting to be completed"
                />

                <StatCard
                  title="Completed"
                  value={completedTasks}
                  icon={<CheckCircle2 size={21} />}
                  description="Successfully finished"
                />

                <StatCard
                  title="Completion Rate"
                  value={
                    tasks.length
                      ? `${Math.round(
                          (completedTasks /
                            tasks.length) *
                            100
                        )}%`
                      : "0%"
                  }
                  icon={<CheckCircle2 size={21} />}
                  description="Overall workspace progress"
                />
              </section>

              {/* Tasks */}
              <section className="mt-8">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Recent Tasks
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Tasks created or assigned to you
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {(
                      [
                        "all",
                        "pending",
                        "completed",
                      ] as const
                    ).map((filter) => (
                      <button
                        key={filter}
                        onClick={() =>
                          setActiveFilter(filter)
                        }
                        className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition ${
                          activeFilter === filter
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-900 text-slate-500 hover:text-white"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                  {filteredTasks.length === 0 ? (
                    <EmptyState
                      hasTasks={tasks.length > 0}
                      onCreate={() =>
                        setShowCreateTask(true)
                      }
                    />
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {filteredTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          currentUserId={user.id}
                          onComplete={
                            handleCompleteTask
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* My Tasks */}
          {activeSection === "tasks" && (
            <MyTasksSection
              tasks={tasks}
              currentUserId={user.id}
              search={search}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              onComplete={handleCompleteTask}
              onCreate={() =>
                setShowCreateTask(true)
              }
            />
          )}

          {/* Calendar */}
          {activeSection === "calendar" && (
            <CalendarSection tasks={tasks} />
          )}

          {/* Team */}
          {activeSection === "team" && (
            <TeamSection />
          )}

          {/* Settings */}
          {activeSection === "settings" && (
            <SettingsSection user={user} />
          )}
        </div>
      </main>

      {/* Create task modal */}
      {showCreateTask && (
        <CreateTaskModal
          onClose={() => setShowCreateTask(false)}
          onCreated={async () => {
            await loadDashboard();
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------
   Loading
------------------------------------------------------- */

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500" />
        </div>

        <h2 className="mt-5 font-semibold">
          Loading TaskFlow
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Preparing your workspace...
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Login
------------------------------------------------------- */

function LoginScreen() {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />

      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />

      {/* Left branding */}
      <div className="relative hidden flex-1 flex-col justify-between border-r border-slate-800 p-10 lg:flex xl:p-14">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
            <ClipboardList size={22} />
          </div>

          <div>
            <h1 className="font-bold tracking-tight">
              TaskFlow
            </h1>

            <p className="text-xs text-slate-500">
              Work smarter
            </p>
          </div>
        </div>

        <div className="max-w-xl">
          <div className="mb-5 inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
            task management
          </div>

          <h2 className="text-5xl font-bold leading-tight tracking-tight xl:text-6xl">
            Plan your work.
            <br />
            <span className="text-indigo-400">
              Get it done.
            </span>
          </h2>

          <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
            Manage tasks, collaborate with your team and
            stay on top of deadlines with a focused
            workspace built for modern teams.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <FeaturePill
              icon={<CheckCircle2 size={15} />}
              text="Task tracking"
            />

            <FeaturePill
              icon={<Users size={15} />}
              text="Team collaboration"
            />

            <FeaturePill
              icon={<Bell size={15} />}
              text="Email notifications"
            />
          </div>
        </div>

        <p className="text-xs text-slate-600">
          © 2026 TaskFlow. Built for productive teams.
        </p>
      </div>

      {/* Login */}
      <div className="relative flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-[480px] lg:px-10 xl:w-[560px]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600">
              <ClipboardList size={22} />
            </div>

            <span className="text-xl font-bold">
              TaskFlow
            </span>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-9">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
                <ClipboardList size={27} />
              </div>

              <h1 className="mt-6 text-2xl font-bold tracking-tight">
                Welcome to TaskFlow
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in to manage your tasks and collaborate
                with your team.
              </p>
            </div>

            {/* Google */}
            <button
              onClick={loginWithGoogle}
              className="group mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-white px-5 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 hover:shadow-lg"
            >
              <GoogleIcon />

              <span>Continue with Google</span>
            </button>

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-800" />

              <span className="text-xs text-slate-600">
                SECURE SIGN IN
              </span>

              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <div className="space-y-3">
              <SecurityItem
                title="Secure authentication"
                description="Sign in securely with your Google account."
              />

              <SecurityItem
                title="Your workspace"
                description="Access your tasks from any device."
              />
            </div>

            <p className="mt-7 text-center text-xs leading-5 text-slate-600">
              By continuing, you agree to use TaskFlow for
              authorized work and collaboration.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-600 lg:hidden">
            © 2026 TaskFlow
          </p>
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------
   Sidebar Item
------------------------------------------------------- */

function SidebarItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
        active
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* -------------------------------------------------------
   Stat Card
------------------------------------------------------- */

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700 hover:bg-slate-900/80">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
          {icon}
        </div>
      </div>

      <p className="mt-5 text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-600">
        {description}
      </p>
    </div>
  );
}

/* -------------------------------------------------------
   My Tasks Section
------------------------------------------------------- */

function MyTasksSection({
  tasks,
  currentUserId,
  search,
  activeFilter,
  setActiveFilter,
  onComplete,
  onCreate,
}: {
  tasks: Task[];
  currentUserId: number;
  search: string;
  activeFilter: "all" | "pending" | "completed";
  setActiveFilter: (
    filter: "all" | "pending" | "completed"
  ) => void;
  onComplete: (taskId: number) => void;
  onCreate: () => void;
}) {
  const myTasks = useMemo(() => {
    return tasks.filter(
      (task) => task.assigned_to === currentUserId
    );
  }, [tasks, currentUserId]);

  const filteredTasks = useMemo(() => {
    return myTasks.filter((task) => {
      const matchesSearch =
        task.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (task.description || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        activeFilter === "all" ||
        task.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [myTasks, search, activeFilter]);

  const pending = myTasks.filter(
    (task) => task.status === "pending"
  ).length;

  const completed = myTasks.filter(
    (task) => task.status === "completed"
  ).length;

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            My Tasks
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Tasks assigned to you.
          </p>
        </div>

        <button
          onClick={onCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium hover:bg-indigo-500"
        >
          <Plus size={17} />
          New Task
        </button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total"
          value={myTasks.length}
          icon={<ClipboardList size={21} />}
          description="Tasks assigned to you"
        />

        <StatCard
          title="Pending"
          value={pending}
          icon={<Clock3 size={21} />}
          description="Still to complete"
        />

        <StatCard
          title="Completed"
          value={completed}
          icon={<CheckCircle2 size={21} />}
          description="Successfully finished"
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(
          ["all", "pending", "completed"] as const
        ).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition ${
              activeFilter === filter
                ? "bg-indigo-600 text-white"
                : "bg-slate-900 text-slate-500 hover:text-white"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        {filteredTasks.length === 0 ? (
          <EmptyState
            hasTasks={myTasks.length > 0}
            onCreate={onCreate}
          />
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                currentUserId={currentUserId}
                onComplete={onComplete}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   Calendar Section
------------------------------------------------------- */

function CalendarSection({
  tasks,
}: {
  tasks: Task[];
}) {
  const tasksWithDates = useMemo(() => {
    return tasks
      .filter((task) => task.due_date)
      .sort(
        (a, b) =>
          new Date(a.due_date!).getTime() -
          new Date(b.due_date!).getTime()
      );
  }, [tasks]);

  return (
    <section>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">
          Calendar
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          View your task deadlines.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        {tasksWithDates.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
              <CalendarDays size={24} />
            </div>

            <h4 className="mt-4 font-medium">
              No deadlines
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              Tasks with due dates will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {tasksWithDates.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-4 p-5 transition hover:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                    <CalendarDays size={19} />
                  </div>

                  <div className="min-w-0">
                    <h4
                      className={`truncate font-medium ${
                        task.status === "completed"
                          ? "text-slate-500 line-through"
                          : "text-white"
                      }`}
                    >
                      {task.title}
                    </h4>

                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {task.description ||
                        "No description provided"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 sm:text-right">
                  <p className="text-sm font-medium text-slate-300">
                    {new Date(
                      task.due_date!
                    ).toLocaleDateString()}
                  </p>

                  <p
                    className={`mt-1 text-xs capitalize ${
                      task.status === "completed"
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {task.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   Team Section
------------------------------------------------------- */

function TeamSection() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTeam() {
      try {
        const data = await getUsers();

        if (data.status === "success") {
          setUsers(data.users);
        } else {
          setError(
            data.message || "Unable to load team members"
          );
        }
      } catch (error) {
        console.error(
          "Unable to load team:",
          error
        );
        setError(
          "Unable to connect to the server"
        );
      } finally {
        setLoading(false);
      }
    }

    loadTeam();
  }, []);

  return (
    <section>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">
          Team
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          People registered in your TaskFlow workspace.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-16 text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500" />

          <p className="mt-4 text-sm text-slate-500">
            Loading team members...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-10 text-center">
          <p className="text-sm text-red-400">
            {error}
          </p>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-16 text-center">
          <Users
            size={30}
            className="mx-auto text-slate-600"
          />

          <h4 className="mt-4 font-medium">
            No other team members
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            Invite another user by having them sign in
            to TaskFlow.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {users.map((member) => (
            <div
              key={member.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700"
            >
              <div className="flex items-center gap-4">
                {member.profile_picture ? (
                  <img
                    src={member.profile_picture}
                    alt={member.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600">
                    <UserRound size={20} />
                  </div>
                )}

                <div className="min-w-0">
                  <h4 className="truncate font-medium text-white">
                    {member.name}
                  </h4>

                  <p className="truncate text-sm text-slate-500">
                    {member.email}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                TaskFlow member
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------
   Settings Section
------------------------------------------------------- */

function SettingsSection({
  user,
}: {
  user: User;
}) {
  return (
    <section>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">
          Settings
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Manage your TaskFlow account.
        </p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-6">
          <h4 className="font-semibold">
            Profile
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            Your account information from Google.
          </p>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex items-center gap-4">
            {user.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user.name}
                className="h-16 w-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600">
                <UserRound size={25} />
              </div>
            )}

            <div>
              <p className="font-medium text-white">
                {user.name}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Google account
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Name
            </label>

            <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
              {user.name}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Email
            </label>

            <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
              {user.email}
            </div>
          </div>

          <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-4">
            <p className="text-sm font-medium text-indigo-300">
              Account security
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Your account is authenticated securely
              through Google OAuth 2.0.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   Task Row
------------------------------------------------------- */

function TaskRow({
  task,
  currentUserId,
  onComplete,
}: {
  task: Task;
  currentUserId: number;
  onComplete: (taskId: number) => void;
}) {
  const canComplete =
    task.assigned_to === currentUserId &&
    task.status === "pending";

  return (
    <div className="group flex flex-col gap-4 p-5 transition hover:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            task.status === "completed"
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-amber-500/10 text-amber-400"
          }`}
        >
          {task.status === "completed" ? (
            <CheckCircle2 size={19} />
          ) : (
            <Clock3 size={19} />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className={`truncate font-medium ${
                task.status === "completed"
                  ? "text-slate-500 line-through"
                  : "text-white"
              }`}
            >
              {task.title}
            </h4>

            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${
                task.status === "completed"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              {task.status}
            </span>
          </div>

          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {task.description ||
              "No description provided"}
          </p>

          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <CalendarDays size={14} />

            <span>
              {task.due_date
                ? new Date(
                    task.due_date
                  ).toLocaleDateString()
                : "No deadline"}
            </span>
          </div>
        </div>
      </div>

      {canComplete && (
        <button
          onClick={() => onComplete(task.id)}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20"
        >
          <Check size={15} />
          Mark complete
        </button>
      )}

      {task.status === "completed" && (
        <div className="flex shrink-0 items-center gap-2 text-xs text-emerald-500/70">
          <CheckCircle2 size={15} />
          Completed
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   Empty State
------------------------------------------------------- */

function EmptyState({
  hasTasks,
  onCreate,
}: {
  hasTasks: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
        {hasTasks ? (
          <Search size={24} />
        ) : (
          <ClipboardList size={24} />
        )}
      </div>

      <h4 className="mt-4 font-medium">
        {hasTasks
          ? "No matching tasks"
          : "No tasks yet"}
      </h4>

      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        {hasTasks
          ? "Try changing your search or task filter."
          : "Create your first task and start organizing your work."}
      </p>

      {!hasTasks && (
        <button
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium hover:bg-indigo-500"
        >
          <Plus size={17} />
          Create Task
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   Create Task Modal
------------------------------------------------------- */

function CreateTaskModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [loadingUsers, setLoadingUsers] =
    useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getUsers();

        if (data.status === "success") {
          setUsers(data.users);
        } else {
          setError(
            data.message || "Unable to load users"
          );
        }
      } catch {
        setError(
          "Unable to connect to the server"
        );
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, []);

  async function handleCreateTask() {
    setError("");

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (!assignedTo) {
      setError("Please select a user.");
      return;
    }

    setCreating(true);

    try {
      const data = await createTask({
        title: title.trim(),
        description: description.trim(),
        assigned_to: Number(assignedTo),
        due_date: dueDate
          ? new Date(
              `${dueDate}T23:59:59`
            ).toISOString()
          : "",
      });

      if (data.status === "success") {
        await onCreated();
        onClose();
      } else {
        setError(
          data.message || "Failed to create task."
        );
      }
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Plus size={20} />
            </div>

            <h3 className="mt-4 text-xl font-semibold">
              Create New Task
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Assign a task to a member of your team.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={creating}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mt-7 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Task title
            </label>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="e.g. Complete project documentation"
              disabled={creating}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Description
            </label>

            <textarea
              rows={4}
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe what needs to be done..."
              disabled={creating}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Assign to
            </label>

            <select
              value={assignedTo}
              onChange={(event) =>
                setAssignedTo(event.target.value)
              }
              disabled={
                loadingUsers ||
                creating ||
                users.length === 0
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none transition focus:border-indigo-500 disabled:opacity-50"
            >
              <option value="">
                {loadingUsers
                  ? "Loading team members..."
                  : users.length === 0
                  ? "No other users available"
                  : "Select a team member"}
              </option>

              {users.map((user) => (
                <option
                  key={user.id}
                  value={user.id}
                >
                  {user.name} — {user.email}
                </option>
              ))}
            </select>

            {users.length === 0 &&
              !loadingUsers && (
                <p className="mt-2 text-xs text-amber-500/80">
                  You need another registered user
                  before you can assign a task.
                </p>
              )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Due date
            </label>

            <input
              type="date"
              value={dueDate}
              onChange={(event) =>
                setDueDate(event.target.value)
              }
              disabled={creating}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none transition focus:border-indigo-500 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            disabled={creating}
            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleCreateTask}
            disabled={
              creating ||
              loadingUsers ||
              users.length === 0
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}

            {creating
              ? "Creating task..."
              : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Login Components
------------------------------------------------------- */

function FeaturePill({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">
      <span className="text-indigo-400">
        {icon}
      </span>
      {text}
    </div>
  );
}

function SecurityItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
        <Check size={14} />
      </div>

      <div>
        <p className="text-xs font-medium text-slate-300">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-5 text-slate-600">
          {description}
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.72-.06-1.41-.18-2.07H12v3.92h5.22a4.46 4.46 0 0 1-1.94 2.93v2.44h3.14c1.84-1.69 2.93-4.18 2.93-7.22Z"
      />

      <path
        fill="#34A853"
        d="M12 21.99c2.63 0 4.84-.87 6.45-2.5l-3.14-2.44c-.87.58-1.98.93-3.31.93-2.54 0-4.7-1.72-5.47-4.03H3.28v2.52A9.74 9.74 0 0 0 12 21.99Z"
      />

      <path
        fill="#FBBC05"
        d="M6.53 13.95a5.86 5.86 0 0 1 0-3.76V7.67H3.28a9.75 9.75 0 0 0 0 8.8l3.25-2.52Z"
      />

      <path
        fill="#EA4335"
        d="M12 6.16c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.84 3.2 14.63 2.11 12 2.11a9.74 9.74 0 0 0-8.72 5.56l3.25 2.52C7.3 7.88 9.46 6.16 12 6.16Z"
      />
    </svg>
  );
}