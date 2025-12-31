import React, { useState, useEffect, useMemo } from 'react';
import { Paper, IconButton, Autocomplete, CircularProgress, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import throttle from 'lodash/throttle';

export default function SearchBar({ setSearch }) {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAddresses = useMemo(
    () =>
      throttle(async (query, callback) => {
        setLoading(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}+Torino&addressdetails=1&limit=5&countrycodes=it`
          );
          const data = await response.json();
          callback(data);
        } catch (error) {
          console.error("Error fetching addresses:", error);
        } finally {
          setLoading(false);
        }
      }, 500),
    []
  );

  useEffect(() => {
    if (inputValue.length < 3) {
      setOptions([]);
      return;
    }
    fetchAddresses(inputValue, (results) => {
      setOptions(results || []);
    });
  }, [inputValue, fetchAddresses]);

  const handleFinalSearch = (value) => {
    if (value) {
      setSearch(value);
      console.log("Searching for:", value);
    } else {
      setSearch("");
    }
  };

  return (
    <Paper
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        handleFinalSearch(inputValue);
      }}
      sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', margin: '0 4rem 0 4rem', border: '1px solid #ddd' }}
    >
      <Autocomplete
        sx={{ flex: 1 }}
        options={options}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.display_name)}
        filterOptions={(options) => options.filter(opt =>
          opt.address.city === "Torino" ||
          opt.address.town === "Torino"
        )}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        onChange={(event, newValue) => {
          if (newValue) {
            handleFinalSearch(newValue.display_name);
          } else {
            setSearch(null);
            setInputValue('');
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Search address in Turin..."
            variant="standard"
            fullWidth
            InputProps={{
              ...params.InputProps,
              disableUnderline: true,
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
            sx={{ ml: 1, flex: 1 }}
          />
        )}
      />
      <IconButton
        type="submit"
        sx={{ p: '10px' }}
        aria-label="search"
      >
        <SearchIcon />
      </IconButton>
    </Paper>
  );
}