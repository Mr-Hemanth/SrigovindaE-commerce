import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function Profile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  // Profile state details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [bio, setBio] = useState('');

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Address Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [form, setForm] = useState({
    label: 'Home',
    area: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setAddresses(data.addresses || []);
          setName(data.name || currentUser.displayName || '');
          setPhone(data.phone || '');
          setDob(data.dob || '');
          setGender(data.gender || 'Prefer not to say');
          setBio(data.bio || '');
        } else {
          setName(currentUser.displayName || '');
        }
      } catch (err) {
        console.warn('Profile user fetch offline. Using local cache fallback.', err);
        const cachedAddr = localStorage.getItem(`addresses_${currentUser.uid}`);
        if (cachedAddr) setAddresses(JSON.parse(cachedAddr));

        const cachedProfile = localStorage.getItem(`profile_${currentUser.uid}`);
        if (cachedProfile) {
          const profile = JSON.parse(cachedProfile);
          setName(profile.name || '');
          setPhone(profile.phone || '');
          setDob(profile.dob || '');
          setGender(profile.gender || 'Prefer not to say');
          setBio(profile.bio || '');
        }
      }
    };
    
    fetchData();
  }, [currentUser]);

  if (!currentUser) return null;

  // Save profile information
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!name.trim()) return setValidationError('Name cannot be empty.');
    if (!phone.trim()) return setValidationError('Primary contact phone number is required.');
    if (!/^\d{10}$/.test(phone.trim())) {
      return setValidationError('Primary contact phone number must be exactly 10 digits.');
    }

    setLoading(true);
    try {
      const updatedProfile = {
        name: name.trim(),
        phone: phone.trim() || '',
        dob: dob || '',
        gender: gender || 'Prefer not to say',
        bio: bio.trim() || ''
      };
      
      localStorage.setItem(`profile_${currentUser.uid}`, JSON.stringify(updatedProfile));
      await setDoc(doc(db, 'users', currentUser.uid), updatedProfile, { merge: true });
      
      setMessage('Profile details updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error saving profile info:', err);
      setMessage('Failed to save profile. Saved locally.');
      setTimeout(() => setMessage(''), 4000);
    }
    setLoading(false);
  };

  // Set default address
  const handleSetDefault = async (addressId) => {
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    }));
    setAddresses(updatedAddresses);
    saveAddresses(updatedAddresses, 'Default address updated successfully!');
  };

  // Delete address
  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
      if (updatedAddresses.length > 0 && !updatedAddresses.some(a => a.isDefault)) {
        updatedAddresses[0].isDefault = true;
      }
      setAddresses(updatedAddresses);
      saveAddresses(updatedAddresses, 'Address deleted successfully!');
    }
  };

  // Open address modal for editing
  const handleOpenEdit = (address) => {
    setEditingAddressId(address.id);
    setForm({
      label: address.label || 'Home',
      area: address.area || '',
      landmark: address.landmark || '',
      city: address.city || '',
      state: address.state || '',
      pincode: address.pincode || '',
      phone: address.phone || ''
    });
    setValidationError('');
    setShowModal(true);
  };

  // Open address modal for adding
  const handleOpenAdd = () => {
    if (addresses.length >= 4) {
      showNotification('You can save up to 4 addresses max. Please delete one to add a new address.', 'error');
      return;
    }
    setEditingAddressId(null);
    setForm({
      label: 'Home',
      area: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      phone: ''
    });
    setValidationError('');
    setShowModal(true);
  };

  // Save changes to firestore and cache
  const saveAddresses = async (newAddressesList, successMsg) => {
    setLoading(true);
    try {
      localStorage.setItem(`addresses_${currentUser.uid}`, JSON.stringify(newAddressesList));
      await setDoc(doc(db, 'users', currentUser.uid), {
        addresses: newAddressesList
      }, { merge: true });
      setMessage(successMsg || 'Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error saving profile address:', err);
      setMessage('Failed to sync profile addresses with server. Saved locally.');
      setTimeout(() => setMessage(''), 4000);
    }
    setLoading(false);
  };

  // Handle address form submission (Create or Update)
  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    // Validations
    if (!form.area.trim()) return setValidationError('Area / Street detail is required.');
    if (!form.city.trim()) return setValidationError('City or Town is required.');
    if (!form.state.trim()) return setValidationError('State is required.');
    if (!/^\d{6}$/.test(form.pincode.trim())) return setValidationError('Pincode must be exactly 6 digits.');
    if (!/^\d{10}$/.test(form.phone.trim())) return setValidationError('Contact phone number must be exactly 10 digits.');

    let updatedAddresses = [];

    if (editingAddressId) {
      // Update Mode
      updatedAddresses = addresses.map(addr => 
        addr.id === editingAddressId 
          ? { 
              ...addr, 
              label: form.label || 'Home',
              area: form.area.trim(), 
              landmark: form.landmark.trim() || '',
              city: form.city.trim(), 
              state: form.state.trim(), 
              pincode: form.pincode.trim(), 
              phone: form.phone.trim() 
            } 
          : addr
      );
      saveAddresses(updatedAddresses, 'Address updated successfully!');
    } else {
      // Create Mode
      const newAddress = {
        id: `addr_${Date.now()}`,
        label: form.label || 'Home',
        area: form.area.trim(),
        landmark: form.landmark.trim() || '',
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        phone: form.phone.trim(),
        isDefault: addresses.length === 0
      };
      updatedAddresses = [...addresses, newAddress];
      saveAddresses(updatedAddresses, 'Address added successfully!');
    }

    setAddresses(updatedAddresses);
    setShowModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <h1 className="text-2xl md:text-4xl font-bold text-[#0f2a4a] mb-6 md:mb-8 font-serif">My Account</h1>
      
      {message && (
        <div className={`mb-6 px-6 py-4 rounded-xl flex items-center gap-3 text-xs md:text-sm ${
          message.includes('successfully') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
        }`}>
          <svg className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {message}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Section: Account Profile Details Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl elegant-shadow p-5 md:p-8 border border-gray-150 sticky top-28">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#0f2a4a]/10 flex items-center justify-center font-bold text-[#0f2a4a] text-lg border border-[#0f2a4a]/10">
                {name ? name.charAt(0).toUpperCase() : 'C'}
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-gray-800 font-serif leading-none">Personal Info</h2>
                <p className="text-xs text-gray-400 mt-1">Manage your basic profile details</p>
              </div>
            </div>
            
            {validationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                {validationError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 md:space-y-5">
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full px-4 py-2.5 md:py-3 border border-gray-100 bg-gray-50 rounded-xl text-xs md:text-sm text-gray-400 cursor-not-allowed font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 md:py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm text-gray-800 focus:outline-none focus:border-[#0f2a4a]"
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Phone</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 md:py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm text-gray-800 focus:outline-none focus:border-[#0f2a4a]"
                  placeholder="Primary 10-digit phone"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-4 py-2.5 md:py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm text-gray-800 focus:outline-none focus:border-[#0f2a4a]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2.5 md:py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm text-gray-800 focus:outline-none focus:border-[#0f2a4a] bg-white"
                  >
                    <option value="Prefer not to say">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">About / Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a little about yourself..."
                  className="w-full px-4 py-2.5 md:py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm text-gray-800 focus:outline-none focus:border-[#0f2a4a]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#0f2a4a] to-[#1b4965] text-white py-3 rounded-xl font-bold text-xs md:text-sm shadow-md hover:shadow-lg hover:from-[#1b4965] hover:to-[#0f2a4a] transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Profile Details'}
              </button>
            </form>
          </div>
        </div>
 
        {/* Right Section: Address Management CRUD Block */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl elegant-shadow p-5 md:p-8 border border-gray-150 min-h-[500px]">
            <div className="flex flex-row justify-between items-center mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 font-serif">Saved Addresses</h2>
                <p className="text-xs text-gray-500 mt-1">{addresses.length}/4 addresses saved</p>
              </div>
              <button
                type="button"
                onClick={handleOpenAdd}
                disabled={addresses.length >= 4}
                className="bg-[#0f2a4a] hover:bg-[#1b4965] text-white px-4 py-2.5 md:px-5 md:py-3 rounded-xl font-semibold shadow-md transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs md:text-sm"
              >
                + Add Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-3xl">
                <span className="text-4xl block mb-3">📍</span>
                <p className="text-gray-500 font-medium">No saved addresses yet.</p>
                <p className="text-xs text-gray-400 mt-1">Add up to 4 addresses for speedy checkout.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {addresses.map((addr) => (
                  <div 
                    key={addr.id} 
                    className={`border-2 rounded-2xl p-4 md:p-6 relative flex flex-col justify-between transition-all duration-300 ${
                      addr.isDefault 
                        ? 'border-[#0f2a4a] bg-[#f0f5fa]/20 shadow-md' 
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div>
                      {/* Label Badge */}
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider ${
                          addr.label === 'Home' ? 'bg-blue-100 text-blue-800' :
                          addr.label === 'Work' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          📍 {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="bg-[#d4af37] text-white text-[9px] md:text-[10px] font-bold uppercase px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-sm">
                            ★ Default
                          </span>
                        )}
                      </div>

                      {/* Address Fields */}
                      <div className="text-gray-600 text-xs md:text-sm space-y-1 mb-6">
                        <p className="font-semibold text-gray-800 break-words">{addr.area}</p>
                        {addr.landmark && <p className="text-[11px] md:text-xs text-gray-500">Landmark: {addr.landmark}</p>}
                        <p>{addr.city}, {addr.state} - <span className="font-mono font-semibold">{addr.pincode}</span></p>
                        <p className="pt-2 text-[11px] md:text-xs font-medium text-gray-500">📞 Phone: {addr.phone}</p>
                      </div>
                    </div>

                    {/* Operations CRUD Toolbar */}
                    <div className="flex items-center justify-between border-t border-gray-100/70 pt-4 mt-auto">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(addr)}
                          className="text-[#0f2a4a] hover:text-[#1b4965] font-bold text-xs hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-red-500 hover:text-red-700 font-bold text-xs hover:underline"
                        >
                          Delete
                        </button>
                      </div>

                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-xs text-gray-500 hover:text-[#0f2a4a] font-semibold hover:underline"
                        >
                          Set Default
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Address Create / Edit Overlay Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl elegant-shadow w-full max-w-lg overflow-y-auto max-h-[90vh] border border-gray-100">
            
            {/* Modal Header */}
            <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-center bg-[#0f2a4a] text-white">
              <h3 className="text-lg md:text-xl font-bold font-serif">
                {editingAddressId ? '✏️ Edit Address' : '📍 Add New Address'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white text-xl font-bold transition-colors leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleAddressSubmit} className="p-6 md:p-8 space-y-4 md:space-y-5">
              
              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                  {validationError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Address Label</label>
                  <select
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    className="w-full px-3 py-2 md:px-4 md:py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-[#0f2a4a] bg-white"
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder="10-digit number"
                    className="w-full px-3 py-2 md:px-4 md:py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-[#0f2a4a]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Area / Street / House No.</label>
                <input
                  type="text"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  placeholder="Flat No, Wing, Street address"
                  className="w-full px-3 py-2 md:px-4 md:py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-[#0f2a4a]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Landmark</label>
                <input
                  type="text"
                  value={form.landmark}
                  onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                  placeholder="e.g. Near City Mall"
                  className="w-full px-3 py-2 md:px-4 md:py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-[#0f2a4a]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">City / Town</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-3 py-2 md:px-4 md:py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-[#0f2a4a]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">State</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="State"
                    className="w-full px-3 py-2 md:px-4 md:py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-[#0f2a4a]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })}
                    placeholder="6 digits"
                    className="w-full px-3 py-2 md:px-4 md:py-3 border-2 border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:border-[#0f2a4a] font-mono"
                    required
                  />
                </div>
              </div>

              {/* Modal Footer Toolbar */}
              <div className="flex gap-4 pt-6 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl hover:bg-gray-50 transition-all font-semibold text-xs md:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#0f2a4a] text-white py-3 rounded-xl hover:bg-[#1b4965] transition-all font-semibold text-xs md:text-sm shadow-md"
                >
                  {loading ? 'Saving...' : 'Save Address'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
