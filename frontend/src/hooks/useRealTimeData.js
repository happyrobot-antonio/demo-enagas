import { useEffect, useState, useCallback } from 'react';
import { api } from '../utils/api';

export function useRealTimeEmergencies(interval = 2000) {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmergencies = useCallback(async () => {
    try {
      const data = await api.getActiveEmergencies();
      setEmergencies(data.emergencies || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching emergencies:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch inicial
    fetchEmergencies();

    // Polling cada X segundos
    const intervalId = setInterval(fetchEmergencies, interval);

    return () => clearInterval(intervalId);
  }, [fetchEmergencies, interval]);

  return { emergencies, loading, refetch: fetchEmergencies };
}

export function useRealTimeTickets(interval = 3000) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    try {
      const data = await api.getRecentTickets();
      setTickets(data.tickets || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    const intervalId = setInterval(fetchTickets, interval);
    return () => clearInterval(intervalId);
  }, [fetchTickets, interval]);

  return { tickets, loading, refetch: fetchTickets };
}

export function useRealTimeStats(interval = 5000) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats(data.stats || data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const intervalId = setInterval(fetchStats, interval);
    return () => clearInterval(intervalId);
  }, [fetchStats, interval]);

  return { stats, loading, refetch: fetchStats };
}

export function useRealTimeCalls(interval = 3000) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCalls = useCallback(async () => {
    try {
      const data = await api.getActiveCalls();
      setCalls(data.calls || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching calls:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
    const intervalId = setInterval(fetchCalls, interval);
    return () => clearInterval(intervalId);
  }, [fetchCalls, interval]);

  return { calls, loading, refetch: fetchCalls };
}

export function useRealTimeSearches(interval = 4000) {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSearches = useCallback(async () => {
    try {
      const data = await api.getRecentSearches();
      setSearches(data.searches || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching searches:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSearches();
    const intervalId = setInterval(fetchSearches, interval);
    return () => clearInterval(intervalId);
  }, [fetchSearches, interval]);

  return { searches, loading, refetch: fetchSearches };
}

export function useRealTimeTransfers(interval = 4000) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransfers = useCallback(async () => {
    try {
      const data = await api.getRecentTransfers();
      setTransfers(data.transfers || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransfers();
    const intervalId = setInterval(fetchTransfers, interval);
    return () => clearInterval(intervalId);
  }, [fetchTransfers, interval]);

  return { transfers, loading, refetch: fetchTransfers };
}
