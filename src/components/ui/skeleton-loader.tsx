import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  variant?: 'default' | 'shimmer';
}

export function Skeleton({ 
  className = '', 
  height = 'h-4', 
  width = 'w-full',
  variant = 'shimmer'
}: SkeletonProps) {
  const baseClass = `rounded ${height} ${width} ${className}`;
  const variantClass = variant === 'shimmer' ? 'skeleton' : 'animate-pulse bg-slate-700';
  
  return (
    <div className={`${baseClass} ${variantClass}`} />
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="p-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-16" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="p-4">
        <Skeleton className="h-6 w-16 rounded-full" />
      </td>
      <td className="p-4">
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </td>
    </tr>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Search and filters skeleton */}
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Table skeleton */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              {['Lead Code', 'Photo', 'Contact Info', 'Company', 'Project', 'Value', 'Status', 'Actions'].map((header) => (
                <th key={header} className="text-left p-4">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, index) => (
              <TableRowSkeleton key={index} />
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-xl p-6 border border-slate-600">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="w-12 h-12 rounded-lg" />
      </div>
      <Skeleton className="w-full h-2 rounded-full" />
    </div>
  );
}
