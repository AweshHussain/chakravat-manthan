-- Allow anonymous / service write (INSERT/UPDATE/UPSERT) to tables for backend sync
CREATE POLICY "Allow public insert to cyclone_live" ON public.cyclone_live 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to cyclone_live" ON public.cyclone_live 
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public insert to cyclone_tracks" ON public.cyclone_tracks 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to district_alerts" ON public.district_alerts 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to district_alerts" ON public.district_alerts 
FOR UPDATE USING (true) WITH CHECK (true);
