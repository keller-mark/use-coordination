import React, { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { styled } from '@mui/material/styles';
import { Typography, Link, Container, Unstable_Grid2 as Grid } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { csvParse } from 'd3-dsv';
import { CmvProvider } from 'mm-cmv';
import type { CmvProviderProps } from 'mm-cmv';

const StyledNavbarImage = styled('img')`
  height: 50px;
` as any;

const NavBarGrid = styled(Grid)`
  border-bottom: 1px solid gray;
` as typeof Grid;

const CenteredGridText = styled(Grid)`
  text-align: center;
` as typeof Grid;

const SingleLineLink = styled(Link)`
  white-space: nowrap;
  text-decoration: none;
` as typeof Link;

const DisabledLink = styled(SingleLineLink as any)`
  color: gray;
` as typeof Link;

const EnabledLink = styled(SingleLineLink as any)`
  font-weight: bold;
` as typeof Link;


export default function Demo() {

  return (
    <>
      <CssBaseline />
      <Container>
        <NavBarGrid container spacing={1} alignItems="center">
          <Grid container xs={3} alignItems="center">
            <Grid xs={6}>
              <Typography sx={{ whiteSpace: 'nowrap' }}>mmCMV</Typography>
            </Grid>
          </Grid>
        </NavBarGrid>
      
        <CmvProvider>
          {/* TODO */}
        </CmvProvider>
      </Container>
    </>
  );
}