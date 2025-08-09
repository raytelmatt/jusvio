import { useState } from 'react';
import { 
  User, 
  FileText, 
  MapPin,
  Save,
  ArrowRight,
  Check,
  Phone,
  Scale,
  Shield
} from 'lucide-react';

interface CriminalIntakeFormData {
  // Personal Information
  first_name: string;
  last_name: string;
  middle_name: string;
  date_of_birth: string;
  ssn_last4: string;
  gender: string;
  race_ethnicity: string;
  citizenship_status: string;
  
  // Contact Information
  email: string;
  mobile_phone: string;
  home_phone: string;
  work_phone: string;
  preferred_contact_method: string;
  
  // Address Information
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  
  // Emergency Contact with Full Address
  emergency_contact: {
    name: string;
    relationship: string;
    mobile_phone: string;
    home_phone: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  
  // Employment Information
  employment_status: string;
  employer_name: string;
  employer_address: string;
  monthly_income: string;
  
  // Criminal Case Information - Texas Specific
  charges: string;
  charge_type: string; // felony/misdemeanor
  arrest_date: string;
  arrest_county: string;
  case_number: string;
  court_date: string;
  court_name: string;
  bond_amount: string;
  bond_status: string;
  jail_release_date: string;
  appointed_counsel: string;
  
  // Background Information
  prior_arrests: string;
  prior_convictions: string;
  probation_parole_status: string;
  drivers_license_status: string;
  immigration_concerns: string;
  
  // Incident Details
  incident_description: string;
  incident_location: string;
  witnesses: string;
  police_report_number: string;
  
  // Additional Information
  medical_conditions: string;
  medications: string;
  mental_health_treatment: string;
  substance_abuse_history: string;
  urgency_level: string;
  how_did_you_hear: string;
}

export default function CriminalIntakeForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<CriminalIntakeFormData>({
    first_name: '',
    last_name: '',
    middle_name: '',
    date_of_birth: '',
    ssn_last4: '',
    gender: '',
    race_ethnicity: '',
    citizenship_status: 'US Citizen',
    email: '',
    mobile_phone: '',
    home_phone: '',
    work_phone: '',
    preferred_contact_method: 'Mobile Phone',
    address: {
      street: '',
      city: '',
      state: 'Texas',
      zip: '',
    },
    emergency_contact: {
      name: '',
      relationship: '',
      mobile_phone: '',
      home_phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: 'Texas',
        zip: '',
      },
    },
    employment_status: '',
    employer_name: '',
    employer_address: '',
    monthly_income: '',
    charges: '',
    charge_type: '',
    arrest_date: '',
    arrest_county: '',
    case_number: '',
    court_date: '',
    court_name: '',
    bond_amount: '',
    bond_status: '',
    jail_release_date: '',
    appointed_counsel: '',
    prior_arrests: '',
    prior_convictions: '',
    probation_parole_status: '',
    drivers_license_status: '',
    immigration_concerns: '',
    incident_description: '',
    incident_location: '',
    witnesses: '',
    police_report_number: '',
    medical_conditions: '',
    medications: '',
    mental_health_treatment: '',
    substance_abuse_history: '',
    urgency_level: 'High',
    how_did_you_hear: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 6;

  const steps = [
    { id: 1, name: 'Personal Info', icon: User },
    { id: 2, name: 'Contact Details', icon: Phone },
    { id: 3, name: 'Address & Emergency', icon: MapPin },
    { id: 4, name: 'Employment', icon: FileText },
    { id: 5, name: 'Criminal Case', icon: Scale },
    { id: 6, name: 'Review & Submit', icon: Check },
  ];

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
      if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
      if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
      if (formData.ssn_last4 && !/^\d{4}$/.test(formData.ssn_last4)) {
        newErrors.ssn_last4 = 'Please enter the last 4 digits of SSN';
      }
    }

    if (step === 2) {
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.mobile_phone.trim()) newErrors.mobile_phone = 'Mobile phone is required';
    }

    if (step === 3) {
      if (!formData.address.street.trim()) newErrors.street = 'Street address is required';
      if (!formData.address.city.trim()) newErrors.city = 'City is required';
      if (!formData.address.zip.trim()) newErrors.zip = 'ZIP code is required';
      if (!formData.emergency_contact.name.trim()) newErrors.emergency_name = 'Emergency contact name is required';
      if (!formData.emergency_contact.relationship.trim()) newErrors.emergency_relationship = 'Emergency contact relationship is required';
    }

    if (step === 5) {
      if (!formData.charges.trim()) newErrors.charges = 'Charges information is required';
      if (!formData.incident_description.trim()) newErrors.incident_description = 'Incident description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      // Submit criminal intake form (no auth required)
      const response = await fetch('/api/criminal-intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit intake form');
      }

      setSubmitted(true);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to submit intake form. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Intake Form Submitted Successfully
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for contacting us. We have received your criminal defense intake form and will review it promptly.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg text-left">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Attorney will review your case within 24 hours</li>
              <li>• We'll contact you to schedule a consultation</li>
              <li>• You'll receive client portal access via email</li>
              <li>• Initial consultation will be scheduled</li>
            </ul>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            For urgent matters, please call: <strong>(555) 123-4567</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Scale className="w-8 h-8 text-red-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Criminal Defense Intake Form</h1>
          </div>
          <p className="text-lg text-gray-600 mb-2">
            Confidential Criminal Defense Consultation - Texas
          </p>
          <p className="text-sm text-gray-500">
            All information provided is protected by attorney-client privilege
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted ? 'bg-green-500 border-green-500 text-white' :
                    isActive ? 'bg-red-600 border-red-600 text-white' :
                    'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block w-12 h-1 mx-2 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <div key={step.id} className="text-center">
                <p className={`text-xs font-medium ${
                  currentStep >= step.id ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <User className="h-6 w-6 text-red-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.first_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.last_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.date_of_birth ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.date_of_birth && (
                    <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SSN (Last 4 digits)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    pattern="\d{4}"
                    value={formData.ssn_last4}
                    onChange={(e) => setFormData({ ...formData, ssn_last4: e.target.value.replace(/\D/g, '') })}
                    placeholder="1234"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.ssn_last4 ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.ssn_last4 && (
                    <p className="mt-1 text-sm text-red-600">{errors.ssn_last4}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select gender...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Race/Ethnicity
                  </label>
                  <select
                    value={formData.race_ethnicity}
                    onChange={(e) => setFormData({ ...formData, race_ethnicity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select race/ethnicity...</option>
                    <option value="White">White</option>
                    <option value="Black or African American">Black or African American</option>
                    <option value="Hispanic or Latino">Hispanic or Latino</option>
                    <option value="Asian">Asian</option>
                    <option value="American Indian or Alaska Native">American Indian or Alaska Native</option>
                    <option value="Native Hawaiian or Pacific Islander">Native Hawaiian or Pacific Islander</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Citizenship Status
                  </label>
                  <select
                    value={formData.citizenship_status}
                    onChange={(e) => setFormData({ ...formData, citizenship_status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="US Citizen">US Citizen</option>
                    <option value="Legal Permanent Resident">Legal Permanent Resident</option>
                    <option value="Visa Holder">Visa Holder</option>
                    <option value="Other">Other Immigration Status</option>
                    <option value="Undocumented">Undocumented</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <Phone className="h-6 w-6 text-red-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile_phone}
                    onChange={(e) => setFormData({ ...formData, mobile_phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      errors.mobile_phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.mobile_phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.mobile_phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Home Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.home_phone}
                    onChange={(e) => setFormData({ ...formData, home_phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.work_phone}
                    onChange={(e) => setFormData({ ...formData, work_phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Contact Method
                  </label>
                  <select
                    value={formData.preferred_contact_method}
                    onChange={(e) => setFormData({ ...formData, preferred_contact_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="Mobile Phone">Mobile Phone</option>
                    <option value="Home Phone">Home Phone</option>
                    <option value="Work Phone">Work Phone</option>
                    <option value="Email">Email</option>
                    <option value="SMS">Text Message</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Address & Emergency Contact */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="flex items-center mb-6">
                <MapPin className="h-6 w-6 text-red-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Address & Emergency Contact</h2>
              </div>

              {/* Your Address */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, street: e.target.value }
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.street ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.street && (
                      <p className="mt-1 text-sm text-red-600">{errors.street}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, city: e.target.value }
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.city ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={formData.address.zip}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        address: { ...formData.address, zip: e.target.value }
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.zip ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.zip && (
                      <p className="mt-1 text-sm text-red-600">{errors.zip}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.emergency_contact.name}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        emergency_contact: { ...formData.emergency_contact, name: e.target.value }
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.emergency_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.emergency_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.emergency_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship *
                    </label>
                    <input
                      type="text"
                      value={formData.emergency_contact.relationship}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        emergency_contact: { ...formData.emergency_contact, relationship: e.target.value }
                      })}
                      placeholder="e.g., Spouse, Parent, Sibling"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.emergency_relationship ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.emergency_relationship && (
                      <p className="mt-1 text-sm text-red-600">{errors.emergency_relationship}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.emergency_contact.mobile_phone}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        emergency_contact: { ...formData.emergency_contact, mobile_phone: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Home Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.emergency_contact.home_phone}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        emergency_contact: { ...formData.emergency_contact, home_phone: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.emergency_contact.email}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        emergency_contact: { ...formData.emergency_contact, email: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <h4 className="text-base font-medium text-gray-700 mb-3">Emergency Contact Mailing Address</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address
                        </label>
                        <input
                          type="text"
                          value={formData.emergency_contact.address.street}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            emergency_contact: { 
                              ...formData.emergency_contact, 
                              address: { ...formData.emergency_contact.address, street: e.target.value }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.emergency_contact.address.city}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            emergency_contact: { 
                              ...formData.emergency_contact, 
                              address: { ...formData.emergency_contact.address, city: e.target.value }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          value={formData.emergency_contact.address.state}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            emergency_contact: { 
                              ...formData.emergency_contact, 
                              address: { ...formData.emergency_contact.address, state: e.target.value }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={formData.emergency_contact.address.zip}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            emergency_contact: { 
                              ...formData.emergency_contact, 
                              address: { ...formData.emergency_contact.address, zip: e.target.value }
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Employment Information */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <FileText className="h-6 w-6 text-red-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Employment Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employment Status
                  </label>
                  <select
                    value={formData.employment_status}
                    onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select employment status...</option>
                    <option value="Employed Full-time">Employed Full-time</option>
                    <option value="Employed Part-time">Employed Part-time</option>
                    <option value="Self-employed">Self-employed</option>
                    <option value="Unemployed">Unemployed</option>
                    <option value="Student">Student</option>
                    <option value="Retired">Retired</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Income (approximate)
                  </label>
                  <select
                    value={formData.monthly_income}
                    onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select income range...</option>
                    <option value="Under $1,000">Under $1,000</option>
                    <option value="$1,000 - $2,500">$1,000 - $2,500</option>
                    <option value="$2,500 - $5,000">$2,500 - $5,000</option>
                    <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                    <option value="Over $10,000">Over $10,000</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employer Name
                  </label>
                  <input
                    type="text"
                    value={formData.employer_name}
                    onChange={(e) => setFormData({ ...formData, employer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employer Address
                  </label>
                  <input
                    type="text"
                    value={formData.employer_address}
                    onChange={(e) => setFormData({ ...formData, employer_address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Criminal Case Information */}
          {currentStep === 5 && (
            <div className="space-y-8">
              <div className="flex items-center mb-6">
                <Scale className="h-6 w-6 text-red-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Criminal Case Information</h2>
              </div>

              {/* Current Charges */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Current Charges</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      What are you charged with? *
                    </label>
                    <textarea
                      value={formData.charges}
                      onChange={(e) => setFormData({ ...formData, charges: e.target.value })}
                      rows={3}
                      placeholder="Please list all charges you are facing..."
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.charges ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.charges && (
                      <p className="mt-1 text-sm text-red-600">{errors.charges}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Charge Type
                    </label>
                    <select
                      value={formData.charge_type}
                      onChange={(e) => setFormData({ ...formData, charge_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Select charge type...</option>
                      <option value="Class A Misdemeanor">Class A Misdemeanor</option>
                      <option value="Class B Misdemeanor">Class B Misdemeanor</option>
                      <option value="Class C Misdemeanor">Class C Misdemeanor</option>
                      <option value="State Jail Felony">State Jail Felony</option>
                      <option value="Third Degree Felony">Third Degree Felony</option>
                      <option value="Second Degree Felony">Second Degree Felony</option>
                      <option value="First Degree Felony">First Degree Felony</option>
                      <option value="Capital Felony">Capital Felony</option>
                      <option value="Federal">Federal</option>
                      <option value="Not Sure">Not Sure</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Arrest Date
                    </label>
                    <input
                      type="date"
                      value={formData.arrest_date}
                      onChange={(e) => setFormData({ ...formData, arrest_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      County of Arrest
                    </label>
                    <input
                      type="text"
                      value={formData.arrest_county}
                      onChange={(e) => setFormData({ ...formData, arrest_county: e.target.value })}
                      placeholder="e.g., Harris County"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Case Number (if known)
                    </label>
                    <input
                      type="text"
                      value={formData.case_number}
                      onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Next Court Date
                    </label>
                    <input
                      type="date"
                      value={formData.court_date}
                      onChange={(e) => setFormData({ ...formData, court_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Court Name
                    </label>
                    <input
                      type="text"
                      value={formData.court_name}
                      onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
                      placeholder="e.g., 174th District Court"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bond Amount
                    </label>
                    <input
                      type="text"
                      value={formData.bond_amount}
                      onChange={(e) => setFormData({ ...formData, bond_amount: e.target.value })}
                      placeholder="e.g., $5,000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bond Status
                    </label>
                    <select
                      value={formData.bond_status}
                      onChange={(e) => setFormData({ ...formData, bond_status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Select bond status...</option>
                      <option value="Out on Bond">Out on Bond</option>
                      <option value="In Custody">In Custody</option>
                      <option value="No Bond Set">No Bond Set</option>
                      <option value="Bond Denied">Bond Denied</option>
                      <option value="Personal Recognizance">Personal Recognizance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jail Release Date (if applicable)
                    </label>
                    <input
                      type="date"
                      value={formData.jail_release_date}
                      onChange={(e) => setFormData({ ...formData, jail_release_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Do you have a court-appointed attorney?
                    </label>
                    <select
                      value={formData.appointed_counsel}
                      onChange={(e) => setFormData({ ...formData, appointed_counsel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Applied but not assigned">Applied but not assigned</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Background Information */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Background Information</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prior Arrests
                    </label>
                    <textarea
                      value={formData.prior_arrests}
                      onChange={(e) => setFormData({ ...formData, prior_arrests: e.target.value })}
                      rows={2}
                      placeholder="Please describe any prior arrests (dates, charges, outcomes)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prior Convictions
                    </label>
                    <textarea
                      value={formData.prior_convictions}
                      onChange={(e) => setFormData({ ...formData, prior_convictions: e.target.value })}
                      rows={2}
                      placeholder="Please describe any prior convictions (dates, charges, sentences)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Probation/Parole Status
                      </label>
                      <select
                        value={formData.probation_parole_status}
                        onChange={(e) => setFormData({ ...formData, probation_parole_status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        <option value="Not applicable">Not applicable</option>
                        <option value="Currently on probation">Currently on probation</option>
                        <option value="Currently on parole">Currently on parole</option>
                        <option value="Completed probation">Completed probation</option>
                        <option value="Completed parole">Completed parole</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Driver's License Status
                      </label>
                      <select
                        value={formData.drivers_license_status}
                        onChange={(e) => setFormData({ ...formData, drivers_license_status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        <option value="Valid">Valid</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Revoked">Revoked</option>
                        <option value="Expired">Expired</option>
                        <option value="No license">No license</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Immigration Concerns
                    </label>
                    <textarea
                      value={formData.immigration_concerns}
                      onChange={(e) => setFormData({ ...formData, immigration_concerns: e.target.value })}
                      rows={2}
                      placeholder="Do you have any immigration status concerns related to this case?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Incident Details */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Incident Details</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Describe what happened *
                    </label>
                    <textarea
                      value={formData.incident_description}
                      onChange={(e) => setFormData({ ...formData, incident_description: e.target.value })}
                      rows={4}
                      placeholder="Please provide a detailed description of the incident..."
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        errors.incident_description ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.incident_description && (
                      <p className="mt-1 text-sm text-red-600">{errors.incident_description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location of Incident
                      </label>
                      <input
                        type="text"
                        value={formData.incident_location}
                        onChange={(e) => setFormData({ ...formData, incident_location: e.target.value })}
                        placeholder="City, County, Address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Police Report Number
                      </label>
                      <input
                        type="text"
                        value={formData.police_report_number}
                        onChange={(e) => setFormData({ ...formData, police_report_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Witnesses
                    </label>
                    <textarea
                      value={formData.witnesses}
                      onChange={(e) => setFormData({ ...formData, witnesses: e.target.value })}
                      rows={2}
                      placeholder="Names and contact information of any witnesses"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Medical Conditions
                      </label>
                      <textarea
                        value={formData.medical_conditions}
                        onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                        rows={2}
                        placeholder="Any medical conditions that may be relevant"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Medications
                      </label>
                      <textarea
                        value={formData.medications}
                        onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                        rows={2}
                        placeholder="List any medications you are taking"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mental Health Treatment
                      </label>
                      <textarea
                        value={formData.mental_health_treatment}
                        onChange={(e) => setFormData({ ...formData, mental_health_treatment: e.target.value })}
                        rows={2}
                        placeholder="Any current or past mental health treatment"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Substance Abuse History
                      </label>
                      <textarea
                        value={formData.substance_abuse_history}
                        onChange={(e) => setFormData({ ...formData, substance_abuse_history: e.target.value })}
                        rows={2}
                        placeholder="Any relevant substance abuse history or treatment"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Urgency Level
                      </label>
                      <select
                        value={formData.urgency_level}
                        onChange={(e) => setFormData({ ...formData, urgency_level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="High">High - Time sensitive</option>
                        <option value="Urgent">Urgent - Immediate attention needed</option>
                        <option value="Medium">Medium - Standard timeline</option>
                        <option value="Low">Low - General consultation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        How did you hear about us?
                      </label>
                      <select
                        value={formData.how_did_you_hear}
                        onChange={(e) => setFormData({ ...formData, how_did_you_hear: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        <option value="Google Search">Google Search</option>
                        <option value="Referral from friend/family">Referral from friend/family</option>
                        <option value="Another attorney">Another attorney</option>
                        <option value="Social media">Social media</option>
                        <option value="Yellow pages">Yellow pages</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review & Submit */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="flex items-center mb-6">
                <Check className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Review & Submit</h2>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Please review your information:</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Personal Information</h4>
                    <p><strong>Name:</strong> {formData.first_name} {formData.middle_name} {formData.last_name}</p>
                    <p><strong>Date of Birth:</strong> {formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                    <p><strong>Citizenship:</strong> {formData.citizenship_status}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Contact Information</h4>
                    <p><strong>Email:</strong> {formData.email}</p>
                    <p><strong>Mobile:</strong> {formData.mobile_phone}</p>
                    {formData.home_phone && <p><strong>Home:</strong> {formData.home_phone}</p>}
                    <p><strong>Preferred Contact:</strong> {formData.preferred_contact_method}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Address</h4>
                    <p>{formData.address.street}</p>
                    <p>{formData.address.city}, {formData.address.state} {formData.address.zip}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Emergency Contact</h4>
                    <p><strong>Name:</strong> {formData.emergency_contact.name}</p>
                    <p><strong>Relationship:</strong> {formData.emergency_contact.relationship}</p>
                    {formData.emergency_contact.mobile_phone && <p><strong>Mobile:</strong> {formData.emergency_contact.mobile_phone}</p>}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Criminal Case</h4>
                    <p><strong>Charges:</strong> {formData.charges}</p>
                    <p><strong>Charge Type:</strong> {formData.charge_type}</p>
                    {formData.arrest_county && <p><strong>County:</strong> {formData.arrest_county}</p>}
                    <p><strong>Urgency:</strong> {formData.urgency_level}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Bond Status</h4>
                    <p><strong>Bond Amount:</strong> {formData.bond_amount || 'Not specified'}</p>
                    <p><strong>Status:</strong> {formData.bond_status || 'Not specified'}</p>
                    {formData.court_date && <p><strong>Court Date:</strong> {new Date(formData.court_date).toLocaleDateString()}</p>}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-1">Important - What happens next:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Your intake will be reviewed by an experienced criminal defense attorney</li>
                        <li>We will contact you within 24 hours</li>
                        <li>You will receive secure client portal access</li>
                        <li>We will schedule your consultation as soon as possible</li>
                        <li>All information is protected by attorney-client privilege</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Urgent Cases:</strong> If you have a court date within 48 hours or are currently in custody, 
                    please call us immediately at <strong>(555) 123-4567</strong>
                  </p>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-4 py-2 text-sm font-medium rounded-lg border ${
                currentStep === 1
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              Previous
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Submit Criminal Defense Intake
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
