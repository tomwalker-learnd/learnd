import React, { useState, useEffect } from 'react';
import { useAutocomplete } from '@/hooks/useAutocomplete';
import { useUserTier } from '@/hooks/useUserTier';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Brain, Sparkles, ArrowRight } from 'lucide-react';
import UpgradeButton from '@/components/premium/UpgradeButton';

interface IntelligentClientInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface NormalizationSuggestion {
  originalName: string;
  suggestedName: string;
  isMatch: boolean;
  confidence: number;
  reasoning: string;
}

export function IntelligentClientInput({
  value,
  onChange,
  placeholder = "Enter client name...",
  disabled = false,
  className
}: IntelligentClientInputProps) {
  const { suggestions, loading, getSuggestions } = useAutocomplete({
    table: 'lessons',
    column: 'client_name',
    minLength: 1,
    debounceMs: 300
  });

  const { tier, canAccessAI } = useUserTier();
  const { toast } = useToast();
  
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [normalizationSuggestion, setNormalizationSuggestion] = useState<NormalizationSuggestion | null>(null);
  const [editedName, setEditedName] = useState('');
  const [skipNormalization, setSkipNormalization] = useState(false);

  // Check for AI normalization when user stops typing and has Business+ tier
  useEffect(() => {
    if (!canAccessAI || skipNormalization || !value || value.length < 3) {
      return;
    }

    // Check if the entered name already exists in suggestions (exact match)
    const exactMatch = suggestions.find(s => s.toLowerCase() === value.toLowerCase());
    if (exactMatch) {
      return;
    }

    const timeoutId = setTimeout(() => {
      checkForNormalization();
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [value, suggestions, canAccessAI, skipNormalization]);

  const checkForNormalization = async () => {
    if (!value || suggestions.length === 0) return;

    setIsNormalizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('normalize-client-name', {
        body: {
          originalName: value,
          existingClients: suggestions.slice(0, 20) // Limit to 20 most relevant clients
        }
      });

      if (error) throw error;

      // Only show confirmation if confidence is high enough and it's a match
      if (data.isMatch && data.confidence >= 75 && data.suggestedName !== value) {
        setNormalizationSuggestion(data);
        setEditedName(value);
        setShowConfirmation(true);
      }
    } catch (error) {
      console.error('Error normalizing client name:', error);
      // Fail silently for better UX
    } finally {
      setIsNormalizing(false);
    }
  };

  const handleConfirmationChoice = async (choice: 'accept' | 'reject' | 'edit') => {
    if (!normalizationSuggestion) return;

    try {
      // Log the user's choice
      await supabase
        .from('client_normalization_requests')
        .update({
          user_choice: choice,
          final_name: choice === 'accept' 
            ? normalizationSuggestion.suggestedName 
            : choice === 'edit' 
            ? editedName 
            : normalizationSuggestion.originalName
        })
        .eq('original_name', normalizationSuggestion.originalName)
        .eq('suggested_name', normalizationSuggestion.suggestedName);

      if (choice === 'accept') {
        onChange(normalizationSuggestion.suggestedName);
        toast({
          title: "Client name updated",
          description: `Updated to "${normalizationSuggestion.suggestedName}"`,
        });
      } else if (choice === 'edit') {
        onChange(editedName);
      } else {
        // User chose to keep as separate client
        setSkipNormalization(true);
      }
    } catch (error) {
      console.error('Error logging user choice:', error);
      // Continue with the action even if logging fails
      if (choice === 'accept') {
        onChange(normalizationSuggestion.suggestedName);
      } else if (choice === 'edit') {
        onChange(editedName);
      }
    }

    setShowConfirmation(false);
    setNormalizationSuggestion(null);
  };

  const handleValueChange = (newValue: string) => {
    onChange(newValue);
    getSuggestions(newValue);
    setSkipNormalization(false); // Reset skip flag when user changes input
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Autocomplete
          value={value}
          onValueChange={handleValueChange}
          placeholder={placeholder}
          suggestions={suggestions}
          loading={loading || isNormalizing}
          disabled={disabled}
          className={className}
        />
        
        {canAccessAI && (
          <Badge variant="secondary" className="shrink-0 text-xs">
            <Brain className="w-3 h-3 mr-1" />
            AI Enhanced
          </Badge>
        )}
        
        {isNormalizing && (
          <Badge variant="outline" className="shrink-0 text-xs animate-pulse">
            <Sparkles className="w-3 h-3 mr-1" />
            Analyzing...
          </Badge>
        )}
      </div>

      {!canAccessAI && tier !== 'enterprise' && (
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700">
              AI client normalization available with Business plan
            </span>
          </div>
          <UpgradeButton
            context="ai-normalization"
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Upgrade
          </UpgradeButton>
        </div>
      )}

      {/* AI Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              AI Notice
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                "{normalizationSuggestion?.originalName}" might be the same as existing client 
                "{normalizationSuggestion?.suggestedName}"
              </p>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-600 font-medium">AI Reasoning:</p>
                <p className="text-sm text-gray-700 mt-1">
                  {normalizationSuggestion?.reasoning}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Confidence: {normalizationSuggestion?.confidence}%
                </p>
              </div>

              <p className="text-sm text-gray-600">
                This helps maintain accurate client analytics by preventing duplicate entries.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Or edit the name:</label>
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Edit client name..."
              />
            </div>
          </div>

          <AlertDialogFooter className="flex-col space-y-2">
            <div className="flex flex-col gap-2 w-full">
              <Button 
                onClick={() => handleConfirmationChoice('accept')}
                className="w-full"
                size="sm"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Use existing client "{normalizationSuggestion?.suggestedName}"
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleConfirmationChoice('edit')}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                  disabled={!editedName.trim()}
                >
                  Use edited name
                </Button>
                
                <Button 
                  onClick={() => handleConfirmationChoice('reject')}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  Keep as separate
                </Button>
              </div>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
