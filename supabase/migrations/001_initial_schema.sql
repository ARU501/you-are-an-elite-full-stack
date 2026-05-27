-- =====================================================
-- LandlordForge - Production Schema (Supabase)
-- Version 2 - Fixed ordering for policies
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 1: CREATE ALL TABLES FIRST
-- (No policies yet - avoids "relation does not exist" errors)
-- =====================================================

-- PROFILES
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('landlord', 'tenant')),
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROPERTIES
CREATE TABLE public.properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  address TEXT NOT NULL,
  unit_label TEXT,
  monthly_rent INTEGER NOT NULL,
  due_day INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  status TEXT DEFAULT 'occupied' CHECK (status IN ('occupied', 'attention', 'vacant')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEASES
CREATE TABLE public.leases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  landlord_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lease_start DATE NOT NULL,
  lease_end DATE,
  monthly_rent INTEGER NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, tenant_id, status)
);

-- MESSAGES
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MAINTENANCE REQUESTS
CREATE TABLE public.maintenance_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE NOT NULL,
  amount_cents INTEGER NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  status TEXT DEFAULT 'due' CHECK (status IN ('due', 'paid', 'overdue', 'pending')),
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RENTAL APPLICATIONS
CREATE TABLE public.rental_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 2: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: CREATE ALL POLICIES (now all tables exist)
-- =====================================================

-- PROFILES
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- PROPERTIES
CREATE POLICY "Landlords can manage their properties"
  ON public.properties FOR ALL
  USING (auth.uid() = landlord_id);

CREATE POLICY "Tenants can view their leased property"
  ON public.properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leases 
      WHERE leases.property_id = properties.id 
      AND leases.tenant_id = auth.uid()
    )
  );

-- LEASES
CREATE POLICY "Landlords can manage leases for their properties"
  ON public.leases FOR ALL
  USING (auth.uid() = landlord_id);

CREATE POLICY "Tenants can view their own leases"
  ON public.leases FOR SELECT
  USING (auth.uid() = tenant_id);

-- MESSAGES
CREATE POLICY "Users can view messages from their leases"
  ON public.messages FOR SELECT
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  );

CREATE POLICY "Users can send messages on their leases"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.leases 
      WHERE leases.id = messages.lease_id 
      AND (leases.landlord_id = auth.uid() OR leases.tenant_id = auth.uid())
    )
  );

-- MAINTENANCE REQUESTS
CREATE POLICY "Tenants can create and view their requests"
  ON public.maintenance_requests FOR ALL
  USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can view and update requests for their properties"
  ON public.maintenance_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leases 
      WHERE leases.id = maintenance_requests.lease_id 
      AND leases.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Landlords can update request status"
  ON public.maintenance_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.leases 
      WHERE leases.id = maintenance_requests.lease_id 
      AND leases.landlord_id = auth.uid()
    )
  );

-- PAYMENTS
CREATE POLICY "Landlords can view payments for their leases"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leases 
      WHERE leases.id = payments.lease_id 
      AND leases.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can view their own payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leases 
      WHERE leases.id = payments.lease_id 
      AND leases.tenant_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can insert their own payments"
  ON public.payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leases 
      WHERE leases.id = payments.lease_id 
      AND leases.tenant_id = auth.uid()
    )
  );

-- RENTAL APPLICATIONS
CREATE POLICY "Landlords can manage applications for their properties"
  ON public.rental_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = rental_applications.property_id 
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Applicants can manage their own applications"
  ON public.rental_applications FOR ALL
  USING (auth.uid() = applicant_id);

-- =====================================================
-- STEP 4: TRIGGERS
-- =====================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'tenant'), NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leases_updated_at
  BEFORE UPDATE ON public.leases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_requests_updated_at
  BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();