import React, { useState } from 'react';
import { PadelProvider, usePadel } from './context/PadelContext';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { ScheduleView } from './components/ScheduleView';
import { BookingsList } from './components/BookingsList';
import { DiscountsManager } from './components/DiscountsManager';
import { CourtsManager } from './components/CourtsManager';
import { UsersSecurityManager } from './components/UsersSecurityManager';
import { UserProfileModal } from './components/UserProfileModal';
import { NewBookingModal } from './components/NewBookingModal';
import { BookingDetailsModal } from './components/BookingDetailsModal';
import { EditBookingModal } from './components/EditBookingModal';
import { ManifaBookingView } from './components/ManifaBookingView';
import { LoginModal } from './components/LoginModal';
import { ToastContainer } from './components/ToastContainer';
import { LiveBookingAlert } from './components/LiveBookingAlert';
import { DesktopNotificationModal } from './components/DesktopNotificationModal';
import { IpnSecurityGate } from './components/IpnSecurityGate';
import { Booking } from './types/padel';

const PadelAppContent: React.FC = () => {
  const {
    theme,
    isLoginModalOpen,
    setIsLoginModalOpen,
    isProfileModalOpen,
    setIsProfileModalOpen,
    profileModalDefaultTab,
    canViewRevenue,
    bookings,
    setSelectedDate,
  } = usePadel();

  const isDark = theme === 'dark';

  // Switch between Booking Section (Customer View) and Admin Section (Management)
  const [currentView, setCurrentView] = useState<'booking' | 'admin'>('admin');
  const [activeAdminTab, setActiveAdminTab] = useState<NavTab>('overview');

  // Modals state
  const [newBookingModalOpen, setNewBookingModalOpen] = useState(false);
  const [newBookingDefaultCourt, setNewBookingDefaultCourt] = useState<string | undefined>(undefined);
  const [newBookingDefaultTime, setNewBookingDefaultTime] = useState<string | undefined>(undefined);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);

  const handleOpenNewBooking = (courtId?: string, time?: string) => {
    setNewBookingDefaultCourt(courtId);
    setNewBookingDefaultTime(time);
    setNewBookingModalOpen(true);
  };

  const handleViewBookingInSchedule = (booking: Booking) => {
    setSelectedDate(booking.date);
    setCurrentView('admin');
    setActiveAdminTab('schedule');
  };

  const handleSelectBookingById = (bookingId?: string, bookingCode?: string) => {
    const target = bookings.find(
      (b) => (bookingId && b.id === bookingId) || (bookingCode && b.bookingCode === bookingCode)
    );
    if (target) {
      setSelectedDate(target.date);
      setSelectedBookingForDetails(target);
      setCurrentView('admin');
      setActiveAdminTab('bookings');
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col selection:bg-[#0369A1] selection:text-white font-sans antialiased transition-colors ${
        isDark ? 'bg-[#0B1220] text-[#F1F5F9]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      {/* Live Global Real-time Booking Notification Alert */}
      <LiveBookingAlert onSelectBookingById={handleSelectBookingById} />

      {/* 1. If user is in Booking Section ("قسم الحجوزات") */}
      {currentView === 'booking' ? (
        <ManifaBookingView onSwitchToAdmin={() => setCurrentView('admin')} />
      ) : (
        /* 2. If user is in Admin Section ("قسم الإدارة") */
        <div className="flex-1 flex flex-col">
          {/* Top Unified Header with Theme Switcher, Notification Bell & Login button */}
          <Navbar
            currentView={currentView}
            setCurrentView={setCurrentView}
            onOpenNewBooking={() => handleOpenNewBooking()}
            onSelectBookingById={handleSelectBookingById}
          />

          {/* Main Admin Area */}
          <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row">
            {/* Sidebar with identical Manifa Padel styling */}
            <Sidebar
              activeTab={activeAdminTab}
              setActiveTab={setActiveAdminTab}
              onOpenCustomerBookingView={() => setCurrentView('booking')}
            />

            {/* Admin Main Tabs Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              {activeAdminTab === 'overview' && (
                <DashboardOverview
                  setActiveTab={setActiveAdminTab}
                  onOpenNewBooking={() => handleOpenNewBooking()}
                  onOpenCustomerBookingView={() => setCurrentView('booking')}
                  onSelectBookingById={handleSelectBookingById}
                  onViewInSchedule={handleViewBookingInSchedule}
                />
              )}

              {activeAdminTab === 'schedule' && (
                <ScheduleView
                  onOpenNewBookingWithSlot={(courtId, time) =>
                    handleOpenNewBooking(courtId, time)
                  }
                  onSelectBooking={(b) => setSelectedBookingForDetails(b)}
                  onEditBooking={(b) => setBookingToEdit(b)}
                />
              )}

              {activeAdminTab === 'bookings' && (
                <BookingsList
                  onOpenNewBooking={() => handleOpenNewBooking()}
                  onSelectBooking={(b) => setSelectedBookingForDetails(b)}
                  onEditBooking={(b) => setBookingToEdit(b)}
                  onViewInSchedule={handleViewBookingInSchedule}
                />
              )}

              {activeAdminTab === 'discounts' && (
                <DiscountsManager
                  onOpenCustomerBookingView={() => setCurrentView('booking')}
                />
              )}

              {activeAdminTab === 'courts' && <CourtsManager />}

              {activeAdminTab === 'users_security' && (
                canViewRevenue ? (
                  <UsersSecurityManager />
                ) : (
                  <div className="p-8 text-center space-y-3 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                    <h3 className="text-base font-bold text-rose-500">محتوى مخصص للمدير العام فقط</h3>
                    <p className="text-xs text-slate-400">قسم المستخدمين والأمان متاح حصرياً لحساب المدير العام لإدارة الصلاحيات وحذف وإضافة المستخدمين.</p>
                    <button
                      onClick={() => setActiveAdminTab('overview')}
                      className="px-4 py-2 rounded-xl bg-[#0369A1] text-white text-xs font-bold"
                    >
                      العودة للنظرة العامة
                    </button>
                  </div>
                )
              )}
            </main>
          </div>
        </div>
      )}

      {/* Login & Verification Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* User Profile & Avatar Modal (Available for both Manager & Staff) */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        defaultTab={profileModalDefaultTab}
      />

      {/* Floating Modals */}
      <NewBookingModal
        isOpen={newBookingModalOpen}
        onClose={() => setNewBookingModalOpen(false)}
        defaultCourtId={newBookingDefaultCourt}
        defaultStartTime={newBookingDefaultTime}
      />

      <BookingDetailsModal
        booking={selectedBookingForDetails}
        onClose={() => setSelectedBookingForDetails(null)}
        onEdit={(b) => setBookingToEdit(b)}
      />

      <EditBookingModal
        booking={bookingToEdit}
        isOpen={Boolean(bookingToEdit)}
        onClose={() => setBookingToEdit(null)}
      />

      {/* Desktop & Background Push Notification Modal */}
      <DesktopNotificationModal />

      {/* Full-Screen IPN Security Gate - Protects entire site and identifies who logged in */}
      <IpnSecurityGate />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <PadelProvider>
      <PadelAppContent />
    </PadelProvider>
  );
}
