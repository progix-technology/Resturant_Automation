import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Phone, Armchair, ArrowRight, ShieldCheck, MessageSquare, ChevronDown } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { useRestaurant } from '../hooks/useRestaurant';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { isValidName, isValidIndianMobile, isValidTableNumber } from '../utils/validators';
import { adminTableService } from '../admin/services/adminTableService';
import { mockTables } from '../admin/data/mockAdminData';

export const CustomerDetailsPage = () => {
  const { restaurantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, createSession } = useSession();
  const { restaurant } = useRestaurant();

  const [tables, setTables] = useState([]);
  const [isLoadingTables, setIsLoadingTables] = useState(true);

  // Pre-fill if guest session exists or from URL query (?table=XX)
  const initialTable = searchParams.get('table') || session?.tableNumber || '';

  const [formData, setFormData] = useState({
    customerName: session?.customerName || '',
    mobile: session?.mobile || '',
    tableNumber: initialTable,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load real-time tables with occupied status
  useEffect(() => {
    let isMounted = true;
    const fetchTables = async () => {
      try {
        const data = await adminTableService.getTables(restaurantSlug);
        if (isMounted) {
          if (data && Array.isArray(data) && data.length > 0) {
            setTables(data);
          } else {
            setTables(mockTables);
          }
        }
      } catch (err) {
        if (isMounted) setTables(mockTables);
      } finally {
        if (isMounted) setIsLoadingTables(false);
      }
    };

    fetchTables();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!isValidName(formData.customerName)) {
      errs.customerName = 'Please enter your full name (at least 2 characters).';
    }
    if (!isValidIndianMobile(formData.mobile)) {
      errs.mobile = 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
    }
    if (!isValidTableNumber(formData.tableNumber)) {
      errs.tableNumber = 'Please select your table number from the list.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      createSession({
        customerName: formData.customerName,
        mobile: formData.mobile,
        tableNumber: formData.tableNumber,
        restaurantSlug,
        restaurantId: restaurant?.id || 'rest-001',
      });

      // Navigate to menu home
      navigate(`/menu/${restaurantSlug}/home`);
    } catch (err) {
      console.error('Session creation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTable = tables.find(
    (t) => String(t.number).trim() === String(formData.tableNumber).trim()
  );

  return (
    <div className="min-h-screen bg-warm-100 flex flex-col justify-center gap-2.5 sm:gap-4 max-w-lg mx-auto p-3.5 sm:p-6 antialiased">
      {/* Top Header */}
      <div>
        <div className="pt-1 pb-2 sm:pb-4 text-center">
          <span className="text-[11px] font-bold text-brand-800 bg-brand-50 border border-brand-200 px-3 py-0.5 rounded-full uppercase tracking-wider">
            Quick Guest Check-in
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 mt-1.5 tracking-tight">
            Welcome to {restaurant?.name || 'Spice Garden'}
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-600 mt-0.5 max-w-xs mx-auto">
            Please enter your dining details to view the menu and place orders from your table.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl p-4 sm:p-7 border border-warm-200 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Full Name */}
            <Input
              label="Full Name"
              required
              placeholder="e.g. Rahul Sharma"
              value={formData.customerName}
              onChange={(e) => handleChange('customerName', e.target.value)}
              error={errors.customerName}
              prefix={<User className="w-4 h-4" />}
            />

            {/* Mobile Number */}
            <Input
              label="Mobile Number"
              required
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="e.g. 9876543210"
              value={formData.mobile}
              onChange={(e) => handleChange('mobile', e.target.value.replace(/\D/g, ''))}
              error={errors.mobile}
              prefix={<Phone className="w-4 h-4" />}
              helperText="We'll send order receipts and live status updates to WhatsApp."
            />

            {/* Table Number Dropdown with Occupied indicator */}
            <div className="w-full flex flex-col gap-1">
              <label
                htmlFor="tableNumber"
                className="text-xs font-semibold text-charcoal-700 tracking-wide uppercase flex items-center justify-between"
              >
                <span>
                  Table Number <span className="text-red-500">*</span>
                </span>
                {selectedTable && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 ${
                      selectedTable.status === 'OCCUPIED'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : selectedTable.status === 'RESERVED'
                        ? 'bg-purple-100 text-purple-900 border border-purple-300'
                        : selectedTable.status === 'CLEANING'
                        ? 'bg-slate-100 text-slate-700 border border-slate-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedTable.status === 'OCCUPIED'
                          ? 'bg-amber-600'
                          : selectedTable.status === 'AVAILABLE'
                          ? 'bg-emerald-600 animate-pulse'
                          : 'bg-slate-500'
                      }`}
                    />
                    {selectedTable.status === 'OCCUPIED'
                      ? 'Occupied'
                      : selectedTable.status === 'RESERVED'
                      ? 'Reserved'
                      : selectedTable.status === 'CLEANING'
                      ? 'Cleaning'
                      : 'Available'}
                  </span>
                )}
              </label>

              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-charcoal-400">
                  <Armchair className="w-4 h-4" />
                </div>

                <select
                  id="tableNumber"
                  value={formData.tableNumber}
                  onChange={(e) => handleChange('tableNumber', e.target.value)}
                  required
                  className={`
                    w-full h-11 pl-11 pr-10 rounded-xl text-sm font-semibold text-charcoal-900 bg-white
                    border transition-all duration-150 outline-none appearance-none cursor-pointer
                    ${
                      errors.tableNumber
                        ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                        : 'border-warm-300 focus:border-brand-700 focus:ring-2 focus:ring-brand-100'
                    }
                  `}
                >
                  <option value="" disabled>
                    {isLoadingTables ? '-- Loading Tables... --' : '-- Select Your Table Number --'}
                  </option>
                  {tables.map((t) => {
                    const isOccupied = t.status === 'OCCUPIED';
                    const isReserved = t.status === 'RESERVED';
                    const isCleaning = t.status === 'CLEANING';

                    let statusText = 'Available';
                    if (isOccupied) statusText = 'Occupied';
                    else if (isReserved) statusText = 'Reserved';
                    else if (isCleaning) statusText = 'Cleaning';

                    const label = `Table ${t.number}${t.section ? ` (${t.section})` : ''} — ${statusText}`;

                    return (
                      <option
                        key={t.id || t.number}
                        value={t.number}
                        className={isOccupied ? 'text-amber-900 bg-amber-50 font-bold' : 'text-charcoal-900'}
                      >
                        {label}
                      </option>
                    );
                  })}
                </select>

                <div className="absolute right-3.5 pointer-events-none text-charcoal-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {errors.tableNumber ? (
                <span className="text-xs text-red-500 font-medium">{errors.tableNumber}</span>
              ) : selectedTable?.status === 'OCCUPIED' ? (
                <span className="text-[11px] text-amber-800 font-medium flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  ⚠️ Table {formData.tableNumber} is currently occupied. You can still order if you are joining this dining group.
                </span>
              ) : (
                <span className="text-[11px] text-charcoal-400">
                  Select the table number matching your physical dining table.
                </span>
              )}
            </div>

            {/* Note banner */}
            <div className="pt-1">
              <div className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-brand-50/80 border border-brand-200 text-xs text-charcoal-700 leading-relaxed">
                <MessageSquare className="w-4 h-4 text-brand-800 shrink-0 mt-0.5" />
                <p>
                  No password or account registration needed. Your table order session is safely saved on your device.
                </p>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                icon={ArrowRight}
                className="shadow-floating text-base"
              >
                Continue to Menu
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer Guarantee */}
      <div className="py-1 sm:py-3 flex items-center justify-center gap-1.5 text-xs text-charcoal-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Your information is only used for table dining service.</span>
      </div>
    </div>
  );
};
