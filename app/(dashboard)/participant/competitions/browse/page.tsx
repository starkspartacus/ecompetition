"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Pagination,
} from "@mui/material";
import CompetitionCard from "@/components/CompetitionCard";

const itemsPerPage = 6;

const CompetitionBrowsePage = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchCompetitions = useCallback(
    async (page = 1, append = false) => {
      if (!append) setIsLoading(true);
      setError(null);

      try {
        let url = "/api/competitions/public";
        const params = new URLSearchParams();

        if (countryFilter && countryFilter !== "")
          params.append("country", countryFilter);
        if (categoryFilter && categoryFilter !== "")
          params.append("category", categoryFilter);
        if (statusFilter && statusFilter !== "")
          params.append("status", statusFilter);
        if (searchQuery) params.append("search", searchQuery);

        // Ajouter la pagination
        params.append("page", page.toString());
        params.append("limit", itemsPerPage.toString());

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        console.log("Fetching competitions from:", url);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }

        const data = await response.json();

        if (append) {
          setCompetitions((prev) => [...prev, ...(data.competitions || [])]);
        } else {
          setCompetitions(data.competitions || []);
        }

        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
        setHasMore(page < Math.ceil((data.total || 0) / itemsPerPage));

        console.log(
          `✅ Page ${page} chargée: ${
            data.competitions?.length || 0
          } compétitions`
        );
      } catch (error) {
        console.error("❌ Erreur:", error);
        setError(
          error instanceof Error ? error.message : "Une erreur est survenue"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, countryFilter, categoryFilter, statusFilter, itemsPerPage]
  );

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCountryFilter(event.target.value);
  };

  const handleCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setCategoryFilter(event.target.value);
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(event.target.value);
  };

  const handlePageChange = (event: any, value: number) => {
    setPage(value);
    fetchCompetitions(value);
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Browse Competitions
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <Select
          value={countryFilter}
          onChange={handleCountryChange}
          displayEmpty
          size="small"
        >
          <MenuItem value="">Country</MenuItem>
          <MenuItem value="USA">USA</MenuItem>
          <MenuItem value="Canada">Canada</MenuItem>
          {/* Add more countries as needed */}
        </Select>
        <Select
          value={categoryFilter}
          onChange={handleCategoryChange}
          displayEmpty
          size="small"
        >
          <MenuItem value="">Category</MenuItem>
          <MenuItem value="Coding">Coding</MenuItem>
          <MenuItem value="Design">Design</MenuItem>
          {/* Add more categories as needed */}
        </Select>
        <Select
          value={statusFilter}
          onChange={handleStatusChange}
          displayEmpty
          size="small"
        >
          <MenuItem value="">Status</MenuItem>
          <MenuItem value="Open">Open</MenuItem>
          <MenuItem value="Closed">Closed</MenuItem>
          {/* Add more statuses as needed */}
        </Select>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            {competitions.map((competition) => (
              <Grid item xs={12} sm={6} md={4} key={competition.id}>
                <CompetitionCard competition={competition} />
              </Grid>
            ))}
          </Grid>
          <Box mt={3} display="flex" justifyContent="center">
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      )}
    </Container>
  );
};

export default CompetitionBrowsePage;
