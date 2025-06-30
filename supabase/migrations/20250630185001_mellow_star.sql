/*
  # Create RxSpot Database Schema

  1. New Tables
    - `pharmacies`
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text)
      - `lat` (decimal)
      - `lng` (decimal) 
      - `phone` (text)
      - `created_at` (timestamp)
    - `medications`
      - `id` (uuid, primary key)
      - `name` (text)
      - `generic_name` (text)
      - `common_shortage` (boolean)
      - `created_at` (timestamp)
    - `reports`
      - `id` (uuid, primary key)
      - `pharmacy_id` (uuid, foreign key)
      - `medication_id` (uuid, foreign key)
      - `status` (text: 'in_stock' or 'out_of_stock')
      - `user_hash` (text)
      - `confidence` (decimal, default 1.0)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated insert access
*/

-- Create pharmacies table
CREATE TABLE IF NOT EXISTS pharmacies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  lat decimal(10, 8) NOT NULL,
  lng decimal(11, 8) NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  generic_name text NOT NULL,
  common_shortage boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid REFERENCES pharmacies(id) ON DELETE CASCADE,
  medication_id uuid REFERENCES medications(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('in_stock', 'out_of_stock')),
  user_hash text NOT NULL,
  confidence decimal(3, 2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policies for pharmacies
CREATE POLICY "Allow public read access to pharmacies"
  ON pharmacies
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert pharmacies"
  ON pharmacies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for medications
CREATE POLICY "Allow public read access to medications"
  ON medications
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert medications"
  ON medications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for reports
CREATE POLICY "Allow public read access to reports"
  ON reports
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow anyone to insert reports"
  ON reports
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pharmacies_location ON pharmacies(lat, lng);
CREATE INDEX IF NOT EXISTS idx_reports_pharmacy_id ON reports(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_reports_medication_id ON reports(medication_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_confidence ON reports(confidence);

-- Insert sample pharmacies in Austin, TX area
INSERT INTO pharmacies (name, address, lat, lng, phone) VALUES
  ('CVS Pharmacy - South Lamar', '1601 S Lamar Blvd, Austin, TX 78704', 30.2575, -97.7645, '(512) 447-3171'),
  ('Walgreens - Downtown Austin', '1000 E 41st St, Austin, TX 78751', 30.2962, -97.7266, '(512) 459-8491'),
  ('H-E-B Pharmacy - Mueller', '1801 E 51st St, Austin, TX 78723', 30.3134, -97.7089, '(512) 759-4900'),
  ('CVS Pharmacy - Westlake', '3300 Bee Caves Rd, Austin, TX 78746', 30.2669, -97.8077, '(512) 327-4222'),
  ('Walgreens - North Austin', '13435 Research Blvd, Austin, TX 78750', 30.4518, -97.7507, '(512) 335-8746'),
  ('Target Pharmacy - Barton Creek', '2901 Capital of Texas Hwy, Austin, TX 78746', 30.2608, -97.8098, '(512) 899-3794'),
  ('Walmart Pharmacy - Round Rock', '2000 N IH-35, Round Rock, TX 78664', 30.5174, -97.6789, '(512) 255-0174'),
  ('H-E-B Pharmacy - Cedar Park', '1335 E Whitestone Blvd, Cedar Park, TX 78613', 30.5053, -97.8203, '(512) 259-3034'),
  ('CVS Pharmacy - East Austin', '1000 E 11th St, Austin, TX 78702', 30.2695, -97.7303, '(512) 477-9081'),
  ('Randalls Pharmacy - West Austin', '3300 Bee Caves Rd #650, Austin, TX 78746', 30.2675, -97.8085, '(512) 328-0770'),
  ('Costco Pharmacy - North Austin', '10401 Research Blvd, Austin, TX 78759', 30.4089, -97.7261, '(512) 795-8465'),
  ('Walgreens - South Austin', '5601 Brodie Ln, Austin, TX 78745', 30.2344, -97.8704, '(512) 892-3116'),
  ('H-E-B Pharmacy - Lakeway', '2000 RR 620 S, Lakeway, TX 78734', 30.3622, -97.9778, '(512) 263-4082'),
  ('CVS Pharmacy - Georgetown', '1005 W University Ave, Georgetown, TX 78628', 30.6332, -97.6917, '(512) 868-8588'),
  ('Walgreens - Pflugerville', '1600 W Pecan St, Pflugerville, TX 78660', 30.4394, -97.6200, '(512) 990-9867');

-- Insert sample medications (common ADHD medications)
INSERT INTO medications (name, generic_name, common_shortage) VALUES
  ('Adderall XR', 'amphetamine/dextroamphetamine extended-release', true),
  ('Vyvanse', 'lisdexamfetamine dimesylate', true),
  ('Concerta', 'methylphenidate extended-release', true),
  ('Ritalin', 'methylphenidate', false),
  ('Strattera', 'atomoxetine', false),
  ('Focalin XR', 'dexmethylphenidate extended-release', true),
  ('Quillivant XR', 'methylphenidate extended-release', true),
  ('Daytrana', 'methylphenidate transdermal patch', false);